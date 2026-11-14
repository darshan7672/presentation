"""Unit test for Web-Mercator tile & pixel coordinate round-trip accuracy (< 1 m)."""

import math
from utils import (
    TILE_SIZE,
    global_px_to_latlng,
    latlng_to_global_px,
    latlng_to_tile,
    meters_per_pixel,
)


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlng / 2) ** 2
    )
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def test_roundtrip():
    test_coords = [
        (12.9716, 77.5946),  # Bengaluru
        (22.5726, 88.3639),  # Kolkata
        (23.0225, 72.5714),  # Ahmedabad
        (30.9010, 75.8573),  # Ludhiana
    ]
    zoom = 18
    for lat, lng in test_coords:
        gx, gy = latlng_to_global_px(lat, lng, zoom)
        lat2, lng2 = global_px_to_latlng(gx, gy, zoom)
        err_m = haversine_m(lat, lng, lat2, lng2)
        tx, ty = latlng_to_tile(lat, lng, zoom)
        mpp = meters_per_pixel(lat, zoom)
        print(
            f"Coord ({lat:.4f}, {lng:.4f}) -> Tile ({tx}, {ty}) | "
            f"Round-trip error: {err_m:.6f} m | Resolution: {mpp:.3f} m/px"
        )
        assert err_m < 1.0, f"Round-trip error {err_m} m >= 1.0 m"

    print("ALL TILE MATH ROUND-TRIP ASSERTIONS PASSED (< 1 m error).")


if __name__ == "__main__":
    test_roundtrip()
