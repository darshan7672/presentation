"""CarbonX tree-detection micro-service.

POST /detect  {"polygon": [[lat, lng], ...]}  ->  tree count, tree coordinates, canopy %.

Primary detector : DeepForest (pretrained RGB tree-crown model).
Fallback detector: Excess-Green (ExG) satellite vegetation crown peak finder, used if
                   DeepForest cannot be imported/loaded. The response's `method`
                   field always states which detector produced the result.
"""

import asyncio
import os
from typing import List, Tuple

import numpy as np
from fastapi import FastAPI, HTTPException
from PIL import Image, ImageFilter
from pydantic import BaseModel, Field
from shapely.geometry import Point, Polygon

try:
    from .utils import build_polygon_image, meters_per_pixel
except ImportError:
    from utils import build_polygon_image, meters_per_pixel

app = FastAPI(title="CarbonX Tree Detection Service (DeepForest)")

ZOOM = int(os.getenv("DETECT_ZOOM", "18"))
MAX_TILES = int(os.getenv("DETECT_MAX_TILES", "150"))
SCORE_THRESH = float(os.getenv("DETECT_SCORE_THRESH", "0.3"))

_model = None
_model_error = None


def get_model():
    """Lazy-load DeepForest model once; gracefully fall back if unavailable."""
    global _model, _model_error
    if _model is not None or _model_error is not None:
        return _model
    try:
        from deepforest import main as df_main

        m = df_main.deepforest()
        if hasattr(m, "load_model"):
            try:
                m.load_model("weecology/deepforest-tree")
            except TypeError:
                m.use_release()
        else:
            m.use_release()
        _model = m
    except Exception as e:
        _model_error = str(e)
        print(f"[ml-service] DeepForest unavailable, using ExG satellite fallback: {e}")
    return _model


class DetectRequest(BaseModel):
    polygon: List[List[float]] = Field(..., min_length=3)


def run_deepforest(model, image: Image.Image):
    arr = np.array(image, dtype=np.float32)
    try:
        df = model.predict_tile(
            image=arr, patch_size=400, patch_overlap=0.25, iou_threshold=0.15
        )
    except TypeError:
        df = model.predict_tile(
            raster_path=None, image=arr, patch_size=400, patch_overlap=0.25
        )

    boxes = []
    if df is not None and len(df) > 0:
        for _, r in df.iterrows():
            score = float(r.get("score", 1.0))
            if score >= SCORE_THRESH:
                boxes.append((r["xmin"], r["ymin"], r["xmax"], r["ymax"], score))
    return boxes


def run_exg_fallback(image: Image.Image):
    """Detect individual tree crowns from satellite RGB tiles via Excess-Green (2G - R - B) local maxima."""
    arr = np.array(image, dtype=np.float32) / 255.0
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    exg = 2 * g - r - b

    smooth = Image.fromarray(
        np.clip((exg + 1) * 127.5, 0, 255).astype(np.uint8)
    ).filter(ImageFilter.GaussianBlur(2))
    mx = smooth.filter(ImageFilter.MaxFilter(9))

    s, m = np.array(smooth), np.array(mx)
    thresh = max(float(np.percentile(s, 60)), 135.0)
    ys, xs = np.where((s == m) & (s > thresh))

    half = 6
    boxes = []
    for x, y in zip(xs, ys):
        # Confidence normalized from Excess-Green intensity [thresh..255] -> [0.55..0.96]
        val = float(s[y, x])
        conf = min(0.96, max(0.55, 0.55 + 0.41 * ((val - thresh) / max(1.0, 255.0 - thresh))))
        boxes.append((x - half, y - half, x + half, y + half, conf))
    return boxes


def detect_sync(polygon_latlng: List[Tuple[float, float]]):
    image, to_latlng, polygon_px = build_polygon_image(polygon_latlng, ZOOM, MAX_TILES)
    poly_px = Polygon(polygon_px)
    center_lat = sum(p[0] for p in polygon_latlng) / len(polygon_latlng)
    mpp = meters_per_pixel(center_lat, ZOOM)

    model = get_model()
    if model is not None:
        boxes = run_deepforest(model, image)
        method = "deepforest"
    else:
        boxes = run_exg_fallback(image)
        method = "exg-fallback"

    detections = []
    canopy_px = 0.0
    for xmin, ymin, xmax, ymax, score in boxes:
        cx = (xmin + xmax) / 2
        cy = (ymin + ymax) / 2
        if not poly_px.contains(Point(cx, cy)):
            continue
        lat, lng = to_latlng(cx, cy)
        detections.append(
            {
                "lat": lat,
                "lng": lng,
                "score": round(float(score), 3),
                "crown_m": round(float(max(xmax - xmin, ymax - ymin)) * mpp, 2),
            }
        )
        canopy_px += (xmax - xmin) * (ymax - ymin)

    canopy_pct = round(min(100.0, 100.0 * canopy_px / max(poly_px.area, 1.0)), 1)
    mean_conf = (
        round(sum(d["score"] for d in detections) / len(detections), 3)
        if detections
        else 0.0
    )

    return {
        "tree_count": len(detections),
        "detections": detections,
        "canopy_pct": canopy_pct,
        "mean_confidence": mean_conf,
        "zoom": ZOOM,
        "meters_per_pixel": round(mpp, 3),
        "method": method,
    }


@app.get("/health")
def health():
    model = get_model()
    return {
        "status": "ok",
        "deepforest_loaded": model is not None,
        "model_error": _model_error,
    }


@app.post("/detect")
async def detect(req: DetectRequest):
    if any(len(p) != 2 for p in req.polygon):
        raise HTTPException(
            status_code=422, detail="Each polygon vertex must be [lat, lng]."
        )
    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, detect_sync, [tuple(p) for p in req.polygon]
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {e}")
