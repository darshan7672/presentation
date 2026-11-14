# CarbonX Satellite Tree Detection — Implementation Status & Change Log

**Source Guide:** [CarbonX_Satellite_Tree_Detection_Implementation_Guide.md](file:///c:/Users/darsh/Downloads/CarbonX_Satellite_Tree_Detection_Implementation_Guide.md)  
**Project Root:** `c:\Users\darsh\Desktop\CarbonX\hackathon-carbox`  
**Last Updated:** 2026-11-13

---

## 1. Summary of What All Is Implemented

| Step | Guide Section | Target File(s) | Status | What Was Implemented |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1.1–1.4** | Python ML Microservice Environment & `.gitignore` | [`ml-service/.gitignore`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/ml-service/.gitignore), `ml-service/.venv` | ✅ Completed | Virtual environment created, FastAPI/Pillow/Shapely installed; `deepforest` and PyTorch installed and verified (`GET /health` returns `{"status":"ok","deepforest_loaded":true}`). |
| **Step 1.5–1.6** | Tile Fetching, Geo-Math & FastAPI Detection Service | [`ml-service/utils.py`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/ml-service/utils.py), [`ml-service/main.py`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/ml-service/main.py) | ✅ Completed | Implemented Esri World Imagery tile downloading, stitching, Web-Mercator coordinate transforms, `GET /health`, and `POST /detect` with primary `DeepForest` model loader + automatic Excess-Green ($2G - R - B$) satellite crown peak detector inside the farmer's polygon. |
| **Step 2** | Extend Supabase Schema (`farms` table) | [`supabase/migrations/20261113_add_detection.sql`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/supabase/migrations/20261113_add_detection.sql), [`server/migrations/20231113_add_detection.sql`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/server/migrations/20231113_add_detection.sql) | ✅ Completed | Migration applied in Supabase project `tbdyvkrfprmviwiphxxt`. Verified columns `detected_trees`, `detection_confidence`, and `detected_at` exist on `public.farms` with index `idx_farms_id`. |
| **Step 3** | Node.js Express Bridge Route (`POST /api/detect-trees`) | [`server/server.ts`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/server/server.ts#L248-L311), [`package.json`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/package.json#L9) | ✅ Completed | Added `POST /api/detect-trees` in Express backend that validates the polygon, calls `http://127.0.0.1:8001/detect` with a 30s timeout, persists `detected_trees`, `detection_confidence`, and `detected_at` to Supabase, and returns `{ success: true, result }`. Added `npm run ml-service` script. |
| **Step 4** | Frontend Integration in Satellite Farm Monitor | [`src/pages/FarmMonitor.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L193-L1049) | ✅ Completed | Replaced simulated random tree generator at Step 2 with `runSatelliteTreeDetection()` calling `POST /api/detect-trees`; added loading spinner (`"Running AI tree detection (≈ 30 s)..."`); plotted real detected tree crowns (`<Circle>`) with crown-radius & confidence tooltips on the Leaflet map; updated Step 3 Results Card to show **Detected Trees (Satellite)** alongside **(Farmer: N)**, **Canopy %**, **Detected Carbon & Value**, **> 20% Mismatch Warning Banner**, and a **Re-run Detection** button. |
| **Step 5** | Testing & Verification | [`ml-service/test_tile_math.py`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/ml-service/test_tile_math.py#L1-L46) | ✅ Completed | Verified Web-Mercator `lat/lng -> pixel -> lat/lng` round-trip error is `0.000000 m` (`< 1 m` assertion passed across 4 benchmark coordinates). |

---

## 2. Detailed Chronological Change Log (Updated After Every Change)

### Change #1 — Step 1: Python ML Tree-Detection Microservice (`ml-service/`)
- **Created [`ml-service/.gitignore`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/ml-service/.gitignore#L1-L3)**:
  - Ignores `.venv/`, `__pycache__/`, and `*.pyc`.
- **Created [`ml-service/utils.py`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/ml-service/utils.py#L1-L132)**:
  - `latlng_to_tile(lat, lng, zoom)`: Converts WGS84 coordinates to Web-Mercator XYZ tile indices.
  - `latlng_to_global_px(lat, lng, zoom)` & `global_px_to_latlng(x, y, zoom)`: Sub-pixel accurate Web-Mercator coordinate projection and inverse projection.
  - `meters_per_pixel(lat, zoom)`: Computes ground sample distance (meters/pixel) at a given latitude and zoom.
  - `download_tile(x, y, zoom)`: Downloads 256×256 RGB satellite imagery tiles from Esri World Imagery (`World_Imagery/MapServer/tile/{z}/{y}/{x}`).
  - `stitch_tiles(...)` & `build_polygon_image(polygon_latlng, zoom, max_tiles=150)`: Stitches and crops satellite tiles tightly around the farmer's marked polygon (enforcing `MAX_TILES = 150` safety clamp) and returns `(cropped_image, to_latlng_fn, polygon_px)`.
- **Created [`ml-service/main.py`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/ml-service/main.py#L1-L163)**:
  - `GET /health`: Reports microservice health, whether `DeepForest` is loaded, and any model status notes.
  - `POST /detect`: Accepts `{"polygon": [[lat, lng], ...]}` (minimum 3 vertices).
  - Runs `DeepForest` (`run_deepforest`) when available, or automatically falls back to `run_exg_fallback` (Excess-Green $2G - R - B$ vegetation index with Gaussian smoothing and 9×9 local-maxima peak detection on the real stitched Esri satellite imagery).
  - Filters every candidate crown center through `poly_px.contains(Point(cx, cy))` so **only trees inside the farmer's marked polygon** are counted and returned.
  - Computes and returns `tree_count`, `detections` (`[{ lat, lng, score, crown_m }]`), `canopy_pct`, `mean_confidence`, `zoom`, `meters_per_pixel`, and `method`.

### Change #2 — Step 2: Supabase Schema Migration (`farms` Detection Columns)
- **Created [`supabase/migrations/20261113_add_detection.sql`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/supabase/migrations/20261113_add_detection.sql#L1-L17)** and **[`server/migrations/20231113_add_detection.sql`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/server/migrations/20231113_add_detection.sql#L1-L15)**:
  - Adds `detected_trees INTEGER`, `detection_confidence NUMERIC`, and `detected_at TIMESTAMPTZ` to `public.farms`.
  - Creates index `idx_farms_id` on `public.farms(id)`.

### Change #3 — Step 3: Node.js Express Bridge Route (`server/server.ts` & `package.json`)
- **Modified [`server/server.ts`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/server/server.ts#L248-L311)**:
  - Added `POST /api/detect-trees` route before the general `/api` fallback middleware.
  - Validates `{ polygon, farmId }` (`polygon` must have at least 3 `[lat, lng]` vertices).
  - Calls `http://127.0.0.1:8001/detect` with a 30-second timeout (`AbortController`).
  - Updates `public.farms` in Supabase with `detected_trees: data.tree_count`, `detection_confidence: data.canopy_pct`, and `detected_at: new Date().toISOString()` (gracefully logging a warning if the remote Supabase schema hasn't run the migration yet).
  - Returns `{ success: true, persistedToSupabase, result: data }`.
- **Modified [`package.json`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/package.json#L6-L11)**:
  - Added `"ml-service": "ml-service\\.venv\\Scripts\\uvicorn.exe main:app --app-dir ml-service --host 127.0.0.1 --port 8001"`.

### Change #4 — Step 4: Frontend Integration in Satellite Farm Monitor (`src/pages/FarmMonitor.tsx`)
- **Modified [`src/pages/FarmMonitor.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L193-L205)**:
  - Added state variables: `detectedTrees`, `treePoints`, `treeDetections`, `detectLoading`, `canopyPct`, `detectionMethod`, and `detectError`.
  - Added [`runSatelliteTreeDetection()`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L445-L483) and updated [`handleNextStep()`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L485-L495) so advancing from Step 2 calls `POST /api/detect-trees` with `{ farmId: selectedFarmId, polygon: activePolygon }`.
  - Updated the Step 2 action button ([`FarmMonitor.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L851-L870)) to show a spinner and `"Running AI tree detection (≈ 30 s)..."` while `detectLoading` is active.
  - Rendered real detected trees inside `<MapContainer>` ([`FarmMonitor.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L1030-L1049)) as `<Circle>` overlays (`color: "#84CC16"`, `fillColor: "#10b981"`, `fillOpacity: 0.8`) sized by `crown_m / 2` with interactive tooltips showing `Tree #i • Crown: Xm • Score: Y`.
  - Updated the Step 3 Analysis Results card ([`FarmMonitor.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L938-L1017)):
    - Shows **Detected Trees (Satellite)** side-by-side with `(Farmer: <declared>)`.
    - Shows **Canopy / Health (%)** from `canopy_pct`.
    - Computes **Carbon Stored (Detected)** and **Est. Value (Detected)** using `detectedTrees`.
    - Renders the **> 20% Mismatch Warning Banner** (`⚠️ Farmer-declared count differs by > 20% from satellite detection`) when `Math.abs(detectedTrees - selectedFarmRecord.trees) / selectedFarmRecord.trees > 0.2`.
    - Added a **Re-run Detection** button ([`FarmMonitor.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L909-L917)) so admins can re-trigger satellite detection at Step 3.

### Change #5 — Step 5: Unit Test & Verification (`ml-service/test_tile_math.py`)
- **Created & Executed [`ml-service/test_tile_math.py`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/ml-service/test_tile_math.py#L1-L46)**:
  - Verified Web-Mercator coordinate round-trip (`latlng_to_global_px` $\leftrightarrow$ `global_px_to_latlng`) across 4 Indian farm coordinates at zoom 18 (`~0.51–0.58 m/px`), achieving `0.000000 m` error (`< 1 m` required).

### Change #6 — Admin Login Accessibility & Authentication Enhancement (`src/pages/Login.tsx` & `src/components/Navbar.tsx`)
- **Modified [`src/pages/Login.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/Login.tsx#L610-L645)**:
  - Made the **Admin** role tab permanently visible alongside **Industry** and **Farmer** (previously hidden behind `?admin` or `?role=admin` query parameter condition).
  - Added an interactive credentials banner when the Admin tab is active (`admin@gmail.com` / `admin123`) with a **Fill Credentials** quick button.
  - Enhanced `handleAuth` so entering `admin@gmail.com` automatically logs in as Admin and routes to `/admin` even if the user had not toggled the tab beforehand.
  - Set `localStorage.setItem("activeRole", "admin")` upon admin login.
- **Modified [`src/components/Navbar.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/components/Navbar.tsx#L38-L55)**:
  - Updated role initialization to read `localStorage.getItem("activeRole")` immediately, properly showing the **Dashboard** link (`/admin`) and **ADMIN** badge in the navbar.

### Change #7 — Fix `Failed to fetch` / Abort Timeout During AI Tree Detection (`vite.config.ts`, `server/server.ts`, `src/pages/FarmMonitor.tsx`)
- **Modified [`vite.config.ts`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/vite.config.ts#L42-L55)**:
  - Added `server.watch.ignored` (`**/ml-service/**`, `**/lightning_logs/**`, `**/server/**`, `**/*.md`) so PyTorch Lightning writing `ml-service/lightning_logs/version_0/hparams.yaml` during DeepForest inference no longer triggers a Vite full-page reload that aborts the in-flight `fetch("/api/detect-trees")` request.
  - Increased `/api` proxy `timeout` and `proxyTimeout` to `180000` ms.
- **Modified [`server/server.ts`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/server/server.ts#L258-L261)**:
  - Increased the `AbortController` timeout for `POST /api/detect-trees` from `30000` ms to `120000` ms so larger multi-tile farms complete without aborting.
- **Modified [`src/pages/FarmMonitor.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L449-L466)**:
  - Added safe HTTP status and JSON response parsing before handling detection results.

### Change #8 — Admin Panel Registered Farmers Sync & Local Fallback (`src/pages/AdminPanel.tsx`, `src/pages/FarmerDashboard.tsx`)
- **Modified [`src/pages/AdminPanel.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/AdminPanel.tsx#L183-L234)**:
  - Sorted `farms` by `id` descending (newest registered farms first).
  - Merged any locally cached farm registrations (`carbonx_farm_boundaries` in `localStorage`) not present in Supabase, and used `farmer_name` / `farm_name` / `species` for readable display names.
  - Updated the Overview **Total Farmers** metric card to reflect `farmers.length` and pending verification count.
  - Added a **Refresh** button in the **Farmers** tab header.
- **Modified [`src/pages/FarmerDashboard.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmerDashboard.tsx#L538-L543)**:
  - Added graceful fallback to local cache (`carbonx_farm_boundaries`) if Supabase `farms` insert is rejected by RLS/auth, so newly registered farms still appear in `My Projects` and the Admin Panel.

### Change #9 — Admin Supabase Auth Session Sync & Satellite Farm Monitor Registration Visibility (`src/pages/Login.tsx`, `src/pages/FarmMonitor.tsx`, `src/pages/AdminPanel.tsx`, `server/server.ts`)
- **Modified [`src/pages/Login.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/Login.tsx#L370-L384)**:
  - Fixed `handleAuth` so Admin login authenticates via `supabase.auth.signInWithPassword` first (establishing the real Admin JWT session for `admin@gmail.com`) rather than returning early with only `localStorage.activeRole`. This allows Supabase RLS to return all 21 farm records (including the 13 `pending` / newly registered farms such as `#52 allipur Agroforestry Plot`) instead of only 5 publicly approved rows.
- **Modified [`src/pages/FarmMonitor.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/FarmMonitor.tsx#L244-L310)**:
  - Merged `carbonx_farm_boundaries` local entries into `farmsList`, added farm count `(21)` and a **Refresh** button above the `"Select Registered Farm to Inspect"` dropdown, added a re-sync warning if the browser has no active Supabase Admin JWT, and forwarded the user's `Authorization: Bearer` token to `POST /api/detect-trees`.
- **Modified [`src/pages/AdminPanel.tsx`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/src/pages/AdminPanel.tsx#L651-L668)**:
  - Added a `"Database session not synced"` banner in the Farmers tab when `supabase.auth.getSession()` has no active session, with a one-click re-sign-in link.
- **Modified [`server/server.ts`](file:///c:/Users/darsh/Desktop/CarbonX/hackathon-carbox/server/server.ts#L281-L294)**:
  - Forwarded the caller's `Authorization` bearer header into the Supabase client inside `POST /api/detect-trees` so `detected_trees`, `detection_confidence`, and `detected_at` persist under Admin RLS permissions.

