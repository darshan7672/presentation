"""Tile download, stitching and Web-Mercator geo-math helpers for the tree detection service."""

import io
import math
from typing import Callable, List, Tuple

import requests
from PIL import Image
from shapely.geometry import Point, Polygon

TILE_SIZE = 256
ESRI_URL = (
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
)


# --------------------------------------------------------------
# Convert lat/lng -> XYZ tile at a given zoom (Web Mercator)
# --------------------------------------------------------------
def latlng_to_tile(lat: float, lng: float, zoom: int) -> Tuple[int, int]:
    lat_rad = math.radians(lat)
    n = 2 ** zoom
    x = int((lng + 180.0) / 360.0 * n)
    y = int(
        (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n
    )
    return x, y


def latlng_to_global_px(lat: float, lng: float, zoom: int) -> Tuple[float, float]:
    n = TILE_SIZE * (2 ** zoom)
    x = (lng + 180.0) / 360.0 * n
    lat_rad = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n
    return x, y


def global_px_to_latlng(x: float, y: float, zoom: int) -> Tuple[float, float]:
    n = TILE_SIZE * (2 ** zoom)
    lng = (x / n) * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1.0 - 2.0 * y / n))))
    return lat, lng


def meters_per_pixel(lat: float, zoom: int) -> float:
    return 156543.03392 * math.cos(math.radians(lat)) / (2 ** zoom)


# --------------------------------------------------------------
# Download a single tile from Esri World Imagery (no API key needed
# for low-volume demo use). Returns a Pillow RGB Image.
# --------------------------------------------------------------
def download_tile(x: int, y: int, zoom: int) -> Image.Image:
    r = requests.get(
        ESRI_URL.format(z=zoom, y=y, x=x),
        timeout=10,
        headers={"User-Agent": "CarbonX-MRV-Satellite-Auditor/1.0"},
    )
    r.raise_for_status()
    return Image.open(io.BytesIO(r.content)).convert("RGB")


# --------------------------------------------------------------
# Stitch a rectangular set of tiles into one image; also keep the
# affine transform that maps pixel coordinates -> lat/lng.
# --------------------------------------------------------------
def stitch_tiles(min_x: int, max_x: int, min_y: int, max_y: int, zoom: int):
    tile_w, tile_h = TILE_SIZE, TILE_SIZE
    width = (max_x - min_x + 1) * tile_w
    height = (max_y - min_y + 1) * tile_h
    canvas = Image.new("RGB", (width, height))

    for x in range(min_x, max_x + 1):
        for y in range(min_y, max_y + 1):
            tile = download_tile(x, y, zoom)
            paste_x = (x - min_x) * tile_w
            paste_y = (y - min_y) * tile_h
            canvas.paste(tile, (paste_x, paste_y))

    n = 2 ** zoom
    lng0 = (min_x / n) * 360.0 - 180.0
    deg_per_px = 360.0 / (n * tile_w)

    def pixel_to_latlng(px: float, py: float) -> Tuple[float, float]:
        lng = lng0 + px * deg_per_px
        lat_rad = math.atan(
            math.sinh(math.pi * (1.0 - 2.0 * (min_y * tile_h + py) / (n * tile_h)))
        )
        return math.degrees(lat_rad), lng

    return canvas, pixel_to_latlng


# --------------------------------------------------------------
# Build a cropped RGB image tightly covering `polygon_latlng`,
# returning (cropped_image, to_latlng_fn, polygon_in_cropped_px).
# --------------------------------------------------------------
def build_polygon_image(
    polygon_latlng: List[Tuple[float, float]], zoom: int, max_tiles: int = 150
) -> Tuple[Image.Image, Callable[[float, float], Tuple[float, float]], List[Tuple[float, float]]]:
    gpx = [latlng_to_global_px(lat, lng, zoom) for lat, lng in polygon_latlng]
    min_gx = min(p[0] for p in gpx)
    max_gx = max(p[0] for p in gpx)
    min_gy = min(p[1] for p in gpx)
    max_gy = max(p[1] for p in gpx)

    min_tx = int(min_gx // TILE_SIZE)
    max_tx = int(max_gx // TILE_SIZE)
    min_ty = int(min_gy // TILE_SIZE)
    max_ty = int(max_gy // TILE_SIZE)

    tiles = (max_tx - min_tx + 1) * (max_ty - min_ty + 1)
    if tiles > max_tiles:
        raise ValueError(f"Polygon too large ({tiles} tiles > {max_tiles}) for demo use.")

    canvas = Image.new(
        "RGB",
        ((max_tx - min_tx + 1) * TILE_SIZE, (max_ty - min_ty + 1) * TILE_SIZE),
    )

    for tx in range(min_tx, max_tx + 1):
        for ty in range(min_ty, max_ty + 1):
            canvas.paste(
                download_tile(tx, ty, zoom),
                ((tx - min_tx) * TILE_SIZE, (ty - min_ty) * TILE_SIZE),
            )

    origin_x = min_tx * TILE_SIZE
    origin_y = min_ty * TILE_SIZE
    left = int(min_gx - origin_x)
    top = int(min_gy - origin_y)
    right = int(math.ceil(max_gx - origin_x))
    bottom = int(math.ceil(max_gy - origin_y))

    cropped = canvas.crop((left, top, max(right, left + 1), max(bottom, top + 1)))
    crop_off_x = origin_x + left
    crop_off_y = origin_y + top

    def to_latlng(px: float, py: float) -> Tuple[float, float]:
        return global_px_to_latlng(crop_off_x + px, crop_off_y + py, zoom)

    polygon_px = [(gx - crop_off_x, gy - crop_off_y) for gx, gy in gpx]
    return cropped, to_latlng, polygon_px
