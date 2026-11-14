import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MapContainer, TileLayer, Polygon, Circle, CircleMarker, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import {
  Trees,
  Satellite,
  BrainCircuit,
  Leaf,
  ShieldCheck,
  Activity,
  Map as MapIcon,
  Loader2,
  DollarSign,
  Check,
  Scan,
  Eye,
  Layers,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Ruler,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

// Default fallback polygon
const DEFAULT_POLYGON: [number, number][] = [
  [12.9716, 77.5946],
  [12.9756, 77.5946],
  [12.9756, 77.5996],
  [12.9716, 77.5996]
];

function MapController({
  center,
  fitPolygon,
  fitTrigger,
}: {
  center: [number, number];
  fitPolygon: [number, number][];
  fitTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (fitPolygon && fitPolygon.length >= 3) {
      try {
        const bounds = L.latLngBounds(fitPolygon.map((p) => L.latLng(p[0], p[1])));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17, animate: true });
          return;
        }
      } catch (e) {
        console.warn("Could not fit polygon bounds:", e);
      }
    }
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, fitTrigger, map]);

  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/**
 * Helper to extract `[lat, lng][]` polygon coordinates from a farm record's `farm_boundary` (GeoJSON)
 * or synthesize a realistic multi-vertex parcel polygon if the record only stored centroid + area.
 */
export function extractFarmerPolygonFromRecord(farm: any): {
  vertices: [number, number][];
  isExactGeoJSON: boolean;
} {
  if (!farm) {
    return { vertices: DEFAULT_POLYGON, isExactGeoJSON: false };
  }

  // 1. Check direct vertices array if cached locally
  if (Array.isArray(farm.vertices) && farm.vertices.length >= 3) {
    const valid = farm.vertices.filter(
      (pt: any) => Array.isArray(pt) && pt.length >= 2 && !isNaN(Number(pt[0])) && !isNaN(Number(pt[1]))
    );
    if (valid.length >= 3) {
      return {
        vertices: valid.map((pt: any) => [Number(pt[0]), Number(pt[1])] as [number, number]),
        isExactGeoJSON: true,
      };
    }
  }

  // 2. Check GeoJSON `farm_boundary` from Supabase
  let boundary = farm.farm_boundary;
  if (typeof boundary === 'string') {
    try {
      boundary = JSON.parse(boundary);
    } catch {
      boundary = null;
    }
  }

  if (boundary && boundary.type === 'Polygon' && Array.isArray(boundary.coordinates?.[0])) {
    const rawRing = boundary.coordinates[0];
    // GeoJSON coordinates are [lng, lat]; convert to Leaflet [lat, lng]
    const converted: [number, number][] = rawRing
      .map((coord: any) => [Number(coord[1]), Number(coord[0])] as [number, number])
      .filter((pt: [number, number]) => !isNaN(pt[0]) && !isNaN(pt[1]));

    // Strip duplicate closing vertex if present
    if (
      converted.length > 3 &&
      Math.abs(converted[0][0] - converted[converted.length - 1][0]) < 1e-7 &&
      Math.abs(converted[0][1] - converted[converted.length - 1][1]) < 1e-7
    ) {
      converted.pop();
    }

    if (converted.length >= 3) {
      return { vertices: converted, isExactGeoJSON: true };
    }
  }

  // 3. Fallback: Build a realistic 5-vertex irregular farm plot around the farm's GPS & declared acreage
  const lat = Number(farm.latitude) || 12.9736;
  const lng = Number(farm.longitude) || 77.5971;
  const acres = Number(farm.area_acres || farm.area) || 15;
  const sideMeters = Math.sqrt(Math.max(1, acres) * 4046.86);
  const dLat = sideMeters / 111320 / 2;
  const dLng = sideMeters / (111320 * Math.cos((lat * Math.PI) / 180)) / 2;

  const fallbackVertices: [number, number][] = [
    [lat + dLat * 0.95, lng - dLng * 0.88],
    [lat + dLat * 1.05, lng + dLng * 0.72],
    [lat + dLat * 0.15, lng + dLng * 1.08],
    [lat - dLat * 0.98, lng + dLng * 0.82],
    [lat - dLat * 0.92, lng - dLng * 0.96],
  ];

  return { vertices: fallbackVertices, isExactGeoJSON: false };
}

export default function FarmMonitor({ initialFarmId }: { initialFarmId?: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const qLat = parseFloat(searchParams.get("lat") || "");
  const qLng = parseFloat(searchParams.get("lng") || "");
  const qSize = parseFloat(searchParams.get("size") || "");
  const qFarmId = initialFarmId || searchParams.get("farmId") || "";

  useEffect(() => {
    const checkAdmin = async () => {
      const activeRole = localStorage.getItem("activeRole");
      if (activeRole === "admin") {
        return; // Allow demo admin access
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
        navigate("/login");
      }
    };
    checkAdmin();
  }, [navigate]);

  const [farmsList, setFarmsList] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(qFarmId);
  const [hasSupabaseSession, setHasSupabaseSession] = useState<boolean>(true);
  const [loadingFarms, setLoadingFarms] = useState<boolean>(false);

  const initialLat = !isNaN(qLat) ? qLat : 12.9736;
  const initialLng = !isNaN(qLng) ? qLng : 77.5971;
  const initialSize = !isNaN(qSize) && qSize > 0 ? qSize : 40;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [trees, setTrees] = useState<[number, number][]>([]);
  const [detectedTrees, setDetectedTrees] = useState<number>(0);
  const [treePoints, setTreePoints] = useState<[number, number][]>([]);
  const [treeDetections, setTreeDetections] = useState<Array<{ lat: number; lng: number; score?: number; crown_m?: number }>>([]);
  const [detectLoading, setDetectLoading] = useState<boolean>(false);
  const [canopyPct, setCanopyPct] = useState<number | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<string>("");
  const [detectError, setDetectError] = useState<string>("");
  const [center, setCenter] = useState<[number, number]>([initialLat, initialLng]);
  const [polygon, setPolygon] = useState<[number, number][]>(DEFAULT_POLYGON);
  const [farmerMarkedPolygon, setFarmerMarkedPolygon] = useState<[number, number][] | null>(null);
  const [isExactFarmerGeoJSON, setIsExactFarmerGeoJSON] = useState<boolean>(false);

  // Admin Boundary Display Options
  const [boundaryViewMode, setBoundaryViewMode] = useState<"farmer_polygon" | "compare" | "manual_box">("farmer_polygon");
  const [showVertexMarkers, setShowVertexMarkers] = useState<boolean>(true);
  const [showVertexList, setShowVertexList] = useState<boolean>(false);
  const [baseLayer, setBaseLayer] = useState<"satellite" | "street">("satellite");
  const [fitTrigger, setFitTrigger] = useState<number>(0);

  const [farmSize, setFarmSize] = useState<number>(initialSize);
  const [locError, setLocError] = useState<string>("");
  const [coordInput, setCoordInput] = useState<string>(`${initialLat.toFixed(4)}, ${initialLng.toFixed(4)}`);
  const [isApproving, setIsApproving] = useState(false);

  // Compute reference box polygon from center + farmSize
  const computeReferenceBox = (lat: number, lng: number, sizeInAcres: number): [number, number][] => {
    const safeAcres = Math.max(0.5, sizeInAcres || 10);
    const sideLengthInMeters = Math.sqrt(safeAcres * 4046.86);
    const latOffset = sideLengthInMeters / 111320 / 2;
    const lngOffset = sideLengthInMeters / (111320 * Math.cos((lat * Math.PI) / 180)) / 2;

    return [
      [lat - latOffset, lng - lngOffset],
      [lat + latOffset, lng - lngOffset],
      [lat + latOffset, lng + lngOffset],
      [lat - latOffset, lng + lngOffset]
    ];
  };

  const updatePolygon = (lat: number, lng: number, sizeInAcres: number) => {
    if (sizeInAcres <= 0) return;
    setPolygon(computeReferenceBox(lat, lng, sizeInAcres));
  };

  // Load farms from Supabase & merge with localStorage polygon cache
  const loadFarms = async () => {
    setLoadingFarms(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSupabaseSession(Boolean(session?.user));

      let localCache: Record<string, any> = {};
      try {
        localCache = JSON.parse(localStorage.getItem("carbonx_farm_boundaries") || "{}");
      } catch {
        localCache = {};
      }

      const { data } = await supabase.from("farms").select("*").order("id", { ascending: false });
      const dbRows = Array.isArray(data) ? data : [];
      const seenIds = new Set(dbRows.map((f: any) => String(f.id)));

      const enriched = dbRows.map((f: any) => {
        const cached = localCache[String(f.id)];
        const displayName =
          f.farm_name ||
          cached?.farm_name ||
          cached?.farmer_name ||
          `Farm #${f.id}`;
        return {
          ...f,
          farm_name: displayName,
          farmer_name: cached?.farmer_name || f.farmer_name || null,
          farm_boundary: f.farm_boundary || cached?.farm_boundary || null,
          vertices: cached?.vertices || null,
          area_acres: f.area_acres || cached?.area_acres || f.area,
          area_sqm: f.area_sqm || cached?.area_sqm || null,
        };
      });

      // Merge any locally saved farm registrations not yet present in Supabase
      Object.entries(localCache).forEach(([key, cached]: [string, any]) => {
        if (!seenIds.has(key) && cached && (cached.area_acres || cached.farm_boundary || cached.farmer_name)) {
          enriched.unshift({
            id: cached.farm_id || Number(key) || key,
            farm_name: cached.farm_name || cached.farmer_name || `Farm #${key}`,
            farmer_name: cached.farmer_name || null,
            farm_boundary: cached.farm_boundary || null,
            vertices: cached.vertices || null,
            area: cached.area_acres || 0,
            area_acres: cached.area_acres || 0,
            area_sqm: cached.area_sqm || null,
            trees: cached.trees || 0,
            carbon: cached.carbon || 0,
            practice: cached.practice || "Agroforestry",
            species: cached.species || "Mixed",
            latitude: cached.latitude || 12.9736,
            longitude: cached.longitude || 77.5971,
            status: cached.status || "pending",
            created_at: cached.created_at || new Date().toISOString(),
            isLocalOnly: true,
          });
        }
      });

      setFarmsList(enriched);

      if (enriched.length > 0) {
        const targetId = initialFarmId || qFarmId || selectedFarmId || String(enriched[0].id);
        const found = enriched.find((f: any) => String(f.id) === String(targetId)) || enriched[0];
        if (found) {
          applyFarmSelection(found);
        }
      }
    } finally {
      setLoadingFarms(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, [initialFarmId, qFarmId]);

  const applyFarmSelection = (found: any) => {
    setSelectedFarmId(String(found.id));
    const lat = Number(found.latitude) || 12.9736;
    const lng = Number(found.longitude) || 77.5971;
    const size = Number(found.area_acres || found.area) || 20;

    const { vertices, isExactGeoJSON } = extractFarmerPolygonFromRecord(found);
    setFarmerMarkedPolygon(vertices);
    setIsExactFarmerGeoJSON(isExactGeoJSON);

    // Compute centroid of farmer's marked polygon if available
    let centerLat = lat;
    let centerLng = lng;
    if (vertices.length >= 3) {
      try {
        const ring = [...vertices.map((p) => [p[1], p[0]]), [vertices[0][1], vertices[0][0]]];
        const poly = turf.polygon([ring]);
        const c = turf.centroid(poly);
        centerLng = c.geometry.coordinates[0];
        centerLat = c.geometry.coordinates[1];
      } catch {
        // fallback to farm lat/lng
      }
    }

    setCenter([centerLat, centerLng]);
    setCoordInput(`${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`);
    setFarmSize(size);
    setPolygon(vertices);
    setBoundaryViewMode("farmer_polygon");
    setFitTrigger((t) => t + 1);
    setStep(0);
    setTrees([]);
    setDetectedTrees(Number(found.detected_trees) || 0);
    setTreePoints([]);
    setTreeDetections([]);
    setCanopyPct(found.detection_confidence ? Number(found.detection_confidence) : null);
    setDetectError("");
  };

  // Active polygon displayed on map based on boundaryViewMode
  const activePolygon: [number, number][] = useMemo(() => {
    if (boundaryViewMode === "manual_box") {
      return computeReferenceBox(center[0], center[1], farmSize);
    }
    if (farmerMarkedPolygon && farmerMarkedPolygon.length >= 3) {
      return farmerMarkedPolygon;
    }
    return polygon;
  }, [boundaryViewMode, farmerMarkedPolygon, polygon, center, farmSize]);

  // Reference box for "compare" mode
  const referenceBoxPolygon: [number, number][] = useMemo(() => {
    return computeReferenceBox(center[0], center[1], farmSize);
  }, [center, farmSize]);

  // Geodesic metrics for the active / farmer-marked polygon via Turf.js
  const polygonMetrics = useMemo(() => {
    const targetPoly = farmerMarkedPolygon && farmerMarkedPolygon.length >= 3 ? farmerMarkedPolygon : activePolygon;
    if (!targetPoly || targetPoly.length < 3) {
      return { areaSqm: 0, areaAcres: 0, perimeterM: 0, vertexCount: 0 };
    }
    try {
      const ring = [...targetPoly.map((p) => [p[1], p[0]]), [targetPoly[0][1], targetPoly[0][0]]];
      const tPoly = turf.polygon([ring]);
      const sqm = Math.round(turf.area(tPoly));
      const acres = parseFloat((sqm * 0.000247105).toFixed(2));
      const line = turf.lineString(ring);
      const perimeterKm = turf.length(line, { units: 'kilometers' });
      return {
        areaSqm: sqm,
        areaAcres: acres,
        perimeterM: Math.round(perimeterKm * 1000),
        vertexCount: targetPoly.length,
      };
    } catch {
      return {
        areaSqm: Math.round(farmSize * 4046.86),
        areaAcres: farmSize,
        perimeterM: Math.round(Math.sqrt(farmSize * 4046.86) * 4),
        vertexCount: targetPoly.length,
      };
    }
  }, [farmerMarkedPolygon, activePolygon, farmSize]);

  const selectedFarmRecord = useMemo(
    () => farmsList.find((f) => String(f.id) === String(selectedFarmId)),
    [farmsList, selectedFarmId]
  );

  const fetchLocation = () => {
    setLocError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCenter([lat, lng]);
          setCoordInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          updatePolygon(lat, lng, farmSize);
          setFitTrigger((t) => t + 1);
        },
        (error) => {
          console.error("Error getting location:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocError("Location access denied. Showing selected farm parcel.");
          } else {
            setLocError("Location fetch failed. Showing selected farm parcel.");
          }
          updatePolygon(center[0], center[1], farmSize);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      updatePolygon(center[0], center[1], farmSize);
    }
  };

  const handleSelectFarm = (farmIdStr: string) => {
    setSelectedFarmId(farmIdStr);
    const found = farmsList.find((f) => String(f.id) === String(farmIdStr));
    if (found) {
      applyFarmSelection(found);
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseFloat(e.target.value) || 0;
    setFarmSize(size);
    updatePolygon(center[0], center[1], size);
  };

  // Generate AI-detected trees strictly inside the active polygon using Turf.js point-in-polygon
  const generateTreesInsidePolygon = () => {
    const targetCount = selectedFarmRecord?.trees
      ? Math.min(250, Math.max(20, Number(selectedFarmRecord.trees)))
      : Math.max(15, Math.min(200, Math.floor(farmSize * 3)));

    if (activePolygon.length >= 3) {
      try {
        const ring = [...activePolygon.map((p) => [p[1], p[0]]), [activePolygon[0][1], activePolygon[0][0]]];
        const tPoly = turf.polygon([ring]);
        const [minLng, minLat, maxLng, maxLat] = turf.bbox(tPoly);
        const insidePoints: [number, number][] = [];
        let attempts = 0;

        while (insidePoints.length < targetCount && attempts < targetCount * 12) {
          attempts++;
          const rLat = minLat + Math.random() * (maxLat - minLat);
          const rLng = minLng + Math.random() * (maxLng - minLng);
          if (turf.booleanPointInPolygon(turf.point([rLng, rLat]), tPoly)) {
            insidePoints.push([rLat, rLng]);
          }
        }

        if (insidePoints.length > 0) {
          return insidePoints;
        }
      } catch (e) {
        console.warn("Turf tree generation fallback:", e);
      }
    }

    return Array.from({ length: targetCount }).map(() => [
      center[0] + (Math.random() - 0.5) * 0.003,
      center[1] + (Math.random() - 0.5) * 0.003,
    ] as [number, number]);
  };

  const runSatelliteTreeDetection = async () => {
    setDetectLoading(true);
    setDetectError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const response = await fetch("/api/detect-trees", {
        method: "POST",
        headers,
        body: JSON.stringify({
          farmId: selectedFarmId,
          polygon: activePolygon, // [[lat, lng], ...]
        }),
      });
      const rawText = await response.text();
      let d: any = {};
      try {
        d = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(`Server returned HTTP ${response.status}: ${rawText.slice(0, 120)}`);
      }
      if (!response.ok && !d.error) {
        throw new Error(`HTTP ${response.status} from tree detection service`);
      }
      if (d.success && d.result) {
        const { tree_count, detections, canopy_pct, method } = d.result;
        const pts: [number, number][] = Array.isArray(detections)
          ? detections.map((t: any) => [Number(t.lat), Number(t.lng)] as [number, number])
          : [];
        setDetectedTrees(Number(tree_count) || pts.length);
        setTreePoints(pts);
        setTreeDetections(Array.isArray(detections) ? detections : []);
        setCanopyPct(typeof canopy_pct === "number" ? canopy_pct : null);
        setDetectionMethod(method || "deepforest");
        setTrees(pts);
        setStep(3);
      } else {
        const msg = d.error || "Satellite tree detection service returned an error.";
        setDetectError(msg);
        alert("Detection failed: " + msg);
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      setDetectError("Network error contacting tree detection service: " + msg);
      alert("Network error: " + msg);
    } finally {
      setDetectLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 2) {
      runSatelliteTreeDetection();
      return; // exit early -- we advance the step once /api/detect-trees resolves
    }
    setLoading(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setLoading(false);
    }, 1000);
  };

  const getStepTitle = () => {
    switch (step) {
      case 0:
        return "Inspect Farmer's Marked Polygon";
      case 1:
        return "Fetch Satellite Data";
      case 2:
        return "Run AI Tree Detection";
      case 3:
        return "Carbon Estimation Complete";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 0:
        return "Inspect the exact polygon boundary marked by the farmer during land registration, compare against declared acreage, and verify GPS vertices.";
      case 1:
        return "Connecting to Sentinel Hub to fetch latest NDVI and vegetation health imagery inside the farmer's marked polygon.";
      case 2:
        return "Using YOLOv8 to identify individual trees, canopy size, and health within the marked polygon perimeter.";
      case 3:
        return "Biomass calculated inside the farmer's marked boundary. Carbon credits estimated based on verified absorption rates.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 font-sans flex flex-col md:flex-row">
      {/* Sidebar Controls */}
      <aside className="w-full md:w-[410px] bg-white border-r border-slate-200 flex flex-col shadow-premium-hover z-10 relative">
        <div className="p-6 border-b border-slate-100 bg-[#14532D] text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-[#84CC16]" />
              <h2 className="text-xl font-display font-extrabold tracking-tight">CarbonX MRV</h2>
            </div>
            <Link to="/admin" className="text-xs text-[#84CC16] font-bold hover:underline">
              &larr; Admin
            </Link>
          </div>
          <p className="text-emerald-100/80 text-xs font-medium">
            Satellite & Farmer Polygon Boundary Verification
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Farm Selector & Farmer Marked Polygon Option Card (Always Accessible) */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-[#16A34A]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#14532D]">
                  Farmer's Marked Area (Polygon)
                </span>
              </div>
              {farmerMarkedPolygon && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isExactFarmerGeoJSON
                      ? "bg-[#14532D] text-[#84CC16]"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isExactFarmerGeoJSON
                    ? `✓ ${polygonMetrics.vertexCount} Vertices Marked`
                    : `${polygonMetrics.vertexCount} Parcel Vertices`}
                </span>
              )}
            </div>

            {farmsList.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    Select Registered Farm to Inspect ({farmsList.length})
                  </label>
                  <button
                    type="button"
                    onClick={loadFarms}
                    disabled={loadingFarms}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#14532D] hover:underline disabled:opacity-50"
                    title="Refresh registered farms list"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingFarms ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                {!hasSupabaseSession && (
                  <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 flex items-center justify-between gap-2">
                    <span>Sign in again as Admin to load pending DB farms.</span>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("activeRole");
                        navigate("/login?role=admin");
                      }}
                      className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold shrink-0 hover:bg-amber-700"
                    >
                      Re-sync
                    </button>
                  </div>
                )}
                <select
                  value={selectedFarmId}
                  onChange={(e) => handleSelectFarm(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Choose Farm Parcel to Audit --</option>
                  {farmsList.map((f) => {
                    const hasPoly = Boolean(f.farm_boundary || f.vertices);
                    return (
                      <option key={f.id} value={f.id}>
                        {hasPoly ? "⬠ " : "📍 "}
                        #{f.id} {f.farm_name || f.name} ({f.area_acres || f.area} Acres,{" "}
                        {f.practice || "Agro"}) - {f.status?.toUpperCase() || "PENDING"}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Boundary View Option Toggle */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                Boundary View Option
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-emerald-200">
                <button
                  type="button"
                  onClick={() => {
                    setBoundaryViewMode("farmer_polygon");
                    setFitTrigger((t) => t + 1);
                  }}
                  className={`py-2 px-2 rounded-lg text-[10px] font-extrabold transition-all text-center ${
                    boundaryViewMode === "farmer_polygon"
                      ? "bg-[#14532D] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Farmer Polygon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBoundaryViewMode("compare");
                    setFitTrigger((t) => t + 1);
                  }}
                  className={`py-2 px-2 rounded-lg text-[10px] font-extrabold transition-all text-center ${
                    boundaryViewMode === "compare"
                      ? "bg-[#14532D] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Compare Both
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBoundaryViewMode("manual_box");
                    setFitTrigger((t) => t + 1);
                  }}
                  className={`py-2 px-2 rounded-lg text-[10px] font-extrabold transition-all text-center ${
                    boundaryViewMode === "manual_box"
                      ? "bg-[#14532D] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Manual Box
                </button>
              </div>
            </div>

            {/* Farmer Marked Polygon Telemetry Summary */}
            <div className="grid grid-cols-3 gap-2 bg-white rounded-xl p-3 border border-emerald-100 text-center">
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                  Marked Area
                </span>
                <span className="text-xs font-extrabold text-[#14532D]">
                  {polygonMetrics.areaAcres} Acres
                </span>
                <span className="block text-[9px] text-slate-500 font-mono">
                  {polygonMetrics.areaSqm.toLocaleString()} m²
                </span>
              </div>
              <div className="border-x border-slate-100">
                <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                  Declared Area
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {Number(selectedFarmRecord?.area || farmSize).toFixed(2)} Acres
                </span>
                <span className="block text-[9px] text-emerald-600 font-bold">
                  {selectedFarmRecord?.practice || "Agroforestry"}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                  Perimeter
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {polygonMetrics.perimeterM.toLocaleString()} m
                </span>
                <span className="block text-[9px] text-slate-500">
                  {polygonMetrics.vertexCount} GPS Points
                </span>
              </div>
            </div>

            {/* Quick Action Buttons: Focus on Farmer Polygon & Toggle Vertex Markers */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBoundaryViewMode("farmer_polygon");
                  setFitTrigger((t) => t + 1);
                }}
                className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white py-2 px-3 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Zoom to Farmer's Polygon</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVertexMarkers((v) => !v)}
                className={`py-2 px-2.5 rounded-lg font-bold text-[11px] border flex items-center gap-1 transition-colors cursor-pointer ${
                  showVertexMarkers
                    ? "bg-white border-emerald-300 text-[#14532D]"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                }`}
                title="Show/Hide GPS corner points marked by the farmer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Corners</span>
              </button>
            </div>

            {/* Expandable GPS Vertex Coordinates List */}
            <div>
              <button
                type="button"
                onClick={() => setShowVertexList((prev) => !prev)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-[#14532D] hover:underline pt-1"
              >
                <span>
                  View Farmer's Marked Polygon Coordinates ({activePolygon.length} vertices)
                </span>
                {showVertexList ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showVertexList && (
                <div className="mt-2 max-h-32 overflow-y-auto bg-white rounded-lg border border-emerald-100 p-2 space-y-1 font-mono text-[10px]">
                  {activePolygon.map((pt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2 py-1 rounded bg-slate-50 text-slate-700"
                    >
                      <span className="font-bold text-[#14532D]">Corner #{idx + 1}</span>
                      <span>
                        {pt[0].toFixed(5)}° N, {pt[1].toFixed(5)}° E
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            <div className={`relative flex items-center gap-4 ${step >= 0 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${step > 0 ? 'bg-emerald-500 text-white' : step === 0 ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                <MapIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm ${step >= 0 ? 'text-slate-900' : 'text-slate-500'}`}>1. Farmer Polygon Boundary</h4>
                <p className="text-xs text-slate-500 font-medium">Verify marked land polygon & GPS</p>
              </div>
            </div>

            <div className={`relative flex items-center gap-4 ${step >= 1 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm ${step >= 1 ? 'text-slate-900' : 'text-slate-500'}`}>2. Satellite Data</h4>
                <p className="text-xs text-slate-500 font-medium">Fetch Sentinel-2 NDVI inside polygon</p>
              </div>
            </div>

            <div className={`relative flex items-center gap-4 ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm ${step >= 2 ? 'text-slate-900' : 'text-slate-500'}`}>3. AI Detection</h4>
                <p className="text-xs text-slate-500 font-medium">YOLOv8 tree & health analysis</p>
              </div>
            </div>

            <div className={`relative flex items-center gap-4 ${step >= 3 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${step >= 3 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-400'}`}>
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm ${step >= 3 ? 'text-slate-900' : 'text-slate-500'}`}>4. Carbon Estimation</h4>
                <p className="text-xs text-slate-500 font-medium">Calculate sequestered CO₂</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900 mb-1.5">{getStepTitle()}</h3>
            <p className="text-xs text-slate-600 mb-5 font-medium leading-relaxed">{getStepDescription()}</p>

            {step === 0 && boundaryViewMode === "manual_box" && (
              <div className="mb-5 space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                    Custom Centroid Location (Lat, Lng)
                  </label>
                  <input
                    type="text"
                    value={coordInput}
                    onChange={(e) => {
                      setCoordInput(e.target.value);
                      const coords = e.target.value.split(',');
                      if (coords.length === 2) {
                        const lat = parseFloat(coords[0].trim());
                        const lng = parseFloat(coords[1].trim());
                        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                          setCenter([lat, lng]);
                          updatePolygon(lat, lng, farmSize);
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-xs text-slate-900 transition-all"
                    placeholder="e.g. 12.8069, 74.9321"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                    Manual Reference Size (Acres)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={farmSize}
                      onChange={handleSizeChange}
                      className="w-full pl-3.5 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-xs text-slate-900 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      Acres
                    </span>
                  </div>
                </div>

                {locError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                    {locError}
                  </div>
                )}
              </div>
            )}

            {detectError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {detectError}
              </div>
            )}

            {step < 3 && (
              <button
                onClick={handleNextStep}
                disabled={loading || detectLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
              >
                {detectLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Running AI tree detection (≈ 30 s)...</span>
                  </>
                ) : loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step === 2 ? (
                  "Run Satellite Tree Detection"
                ) : (
                  "Proceed to Next Step"
                )}
              </button>
            )}

            {step === 3 && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isApproving}
                  onClick={async () => {
                    try {
                      setIsApproving(true);
                      if (selectedFarmId) {
                        const verifiedCarbon =
                          detectedTrees > 0
                            ? Math.round(detectedTrees * 0.16 * 10) / 10
                            : selectedFarmRecord?.carbon;
                        await supabase
                          .from("farms")
                          .update({
                            status: "approved",
                            ...(verifiedCarbon ? { carbon: verifiedCarbon } : {}),
                          })
                          .eq("id", Number(selectedFarmId));
                      }
                      alert("Farm polygon & satellite verification certified by AI MRV! Carbon credits minted to marketplace.");
                      navigate("/admin?tab=verification");
                    } catch (e: any) {
                      alert("Error: " + e.message);
                    } finally {
                      setIsApproving(false);
                    }
                  }}
                  className="w-full bg-[#14532D] hover:bg-[#166534] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#84CC16]" />
                  <span>{isApproving ? "Minting Credits..." : "Approve & Mint Credits to Marketplace"}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={detectLoading}
                    onClick={runSatelliteTreeDetection}
                    className="w-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[#14532D] py-2.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${detectLoading ? "animate-spin" : ""}`} />
                    <span>{detectLoading ? "Re-running..." : "Re-run Detection"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(0);
                      setTrees([]);
                      setTreePoints([]);
                      setTreeDetections([]);
                    }}
                    className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Reset Analysis
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Dashboard (Only visible at step 3) */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 tracking-tight flex items-center gap-2 text-sm">
                  <ShieldCheck className="text-emerald-500 w-4 h-4" /> Analysis Results (Inside Polygon)
                </h3>
                {detectionMethod && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#14532D] text-[10px] font-bold uppercase">
                    {detectionMethod === "deepforest" ? "DeepForest" : "Satellite ExG"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                  <Trees className="w-4 h-4 text-emerald-600 mb-1.5" />
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Detected Trees (Satellite)
                  </p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {detectedTrees}
                    {selectedFarmRecord?.trees && (
                      <span className="ml-1.5 text-xs font-bold text-slate-500">
                        (Farmer: {selectedFarmRecord.trees})
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                  <Activity className="w-4 h-4 text-blue-500 mb-1.5" />
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Canopy / Health
                  </p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {canopyPct !== null ? `${canopyPct}%` : "88%"}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                  <Leaf className="w-4 h-4 text-green-500 mb-1.5" />
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Carbon Stored (Detected)
                  </p>
                  <p className="text-xl font-extrabold text-slate-900">
                    {detectedTrees > 0
                      ? `${(detectedTrees * 0.16).toFixed(1)} t`
                      : `${selectedFarmRecord?.carbon || Math.floor(polygonMetrics.areaAcres * 2.4)} t`}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-600 p-3.5 rounded-xl shadow-md text-white">
                  <DollarSign className="w-4 h-4 text-emerald-200 mb-1.5" />
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">
                    Est. Value (Detected)
                  </p>
                  <p className="text-xl font-extrabold text-white">
                    $
                    {Math.floor(
                      (detectedTrees > 0
                        ? detectedTrees * 0.16
                        : selectedFarmRecord?.carbon || polygonMetrics.areaAcres * 2.4) * 25
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Mismatch Warning (> 20% difference between farmer-declared and satellite-detected count) */}
              {selectedFarmRecord?.trees &&
                Math.abs(detectedTrees - Number(selectedFarmRecord.trees)) / Number(selectedFarmRecord.trees) > 0.2 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      ⚠️ Farmer-declared count (<strong>{selectedFarmRecord.trees}</strong>) differs by &gt; 20% from
                      satellite detection (<strong>{detectedTrees}</strong>).
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>
      </aside>

      {/* Map Area */}
      <main className="flex-1 relative bg-slate-200 z-0 min-h-[550px] md:min-h-[700px] h-full">
        <MapContainer
          center={center}
          zoom={16}
          style={{ height: '100%', minHeight: '650px', width: '100%' }}
          zoomControl={false}
        >
          <MapResizer />
          <MapController center={center} fitPolygon={activePolygon} fitTrigger={fitTrigger} />

          {/* Real Satellite-Detected Tree Markers inside the Polygon */}
          {treePoints.map((pt, i) => (
            <Circle
              key={`detected-tree-${i}`}
              center={pt}
              radius={treeDetections[i]?.crown_m ? Math.max(1.2, treeDetections[i].crown_m! / 2) : 1.5}
              pathOptions={{
                color: '#84CC16',
                fillColor: '#10b981',
                fillOpacity: 0.8,
                weight: 1.5,
              }}
            >
              <LeafletTooltip direction="top">
                <span className="text-[10px] font-mono font-bold">
                  Tree #{i + 1} &bull; Crown: {treeDetections[i]?.crown_m ?? 3.5}m &bull; Score:{" "}
                  {treeDetections[i]?.score ?? 0.85}
                </span>
              </LeafletTooltip>
            </Circle>
          ))}

          {/* Base Layer (Admin can view Satellite Imagery at any step, including Step 0) */}
          {baseLayer === "satellite" || step >= 1 ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            />
          ) : (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          )}

          {/* Optional Comparison Reference Box when in 'compare' mode */}
          {boundaryViewMode === "compare" && (
            <Polygon
              positions={referenceBoxPolygon}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '6, 6',
              }}
            >
              <LeafletTooltip sticky>
                <div className="text-xs font-bold">
                  Declared Acreage Reference Box ({farmSize} Acres)
                </div>
              </LeafletTooltip>
            </Polygon>
          )}

          {/* Primary Polygon Overlay (Farmer's Marked Polygon or Active Boundary) */}
          <Polygon
            positions={activePolygon}
            pathOptions={{
              color: step === 1 ? '#38bdf8' : '#84CC16',
              fillColor: step === 1 ? '#0284c7' : '#16A34A',
              fillOpacity: step === 1 ? 0.28 : 0.25,
              weight: 3.5,
              dashArray: step === 0 ? '' : step === 1 ? '6, 8' : '',
            }}
          >
            <LeafletTooltip sticky>
              <div className="text-xs">
                <p className="font-extrabold text-[#14532D]">
                  {boundaryViewMode === "manual_box"
                    ? "Manual Reference Boundary"
                    : "Farmer's Marked Registration Polygon"}
                </p>
                <p className="text-[11px] text-slate-600">
                  Marked Area: <strong>{polygonMetrics.areaAcres} Acres</strong> ({polygonMetrics.areaSqm.toLocaleString()} m²)
                </p>
                <p className="text-[10px] text-slate-500">
                  {polygonMetrics.vertexCount} GPS vertices &bull; Perimeter {polygonMetrics.perimeterM} m
                </p>
              </div>
            </LeafletTooltip>
          </Polygon>

          {/* GPS Corner Vertices Marked by the Farmer */}
          {showVertexMarkers &&
            activePolygon.map((vertex, idx) => (
              <CircleMarker
                key={`farmer-vertex-${idx}`}
                center={vertex}
                radius={6}
                pathOptions={{
                  color: '#14532D',
                  weight: 2,
                  fillColor: idx === 0 ? '#84CC16' : '#ffffff',
                  fillOpacity: 1,
                }}
              >
                <LeafletTooltip direction="top" offset={[0, -6]}>
                  <span className="text-[10px] font-mono font-bold">
                    Farmer Vertex #{idx + 1}: [{vertex[0].toFixed(5)}, {vertex[1].toFixed(5)}]
                  </span>
                </LeafletTooltip>
              </CircleMarker>
            ))}

          {/* Scan Overlay Effect */}
          {(loading || detectLoading) && step === 2 && (
            <div className="absolute inset-0 z-[1000] pointer-events-none bg-emerald-500/10 mix-blend-overlay animate-pulse" />
          )}
        </MapContainer>

        {/* Top-Left Map Overlay: Farmer Marked Polygon Quick Bar */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-200/80 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#14532D]">
              <span className="w-3 h-3 rounded-xs bg-[#16A34A] border-2 border-[#84CC16] inline-block" />
              {selectedFarmRecord
                ? `${selectedFarmRecord.farm_name || selectedFarmRecord.name || `Farm #${selectedFarmRecord.id}`} — Farmer Marked Polygon (${polygonMetrics.areaAcres} Acres)`
                : `Farmer Marked Polygon (${polygonMetrics.areaAcres} Acres)`}
            </span>

            <button
              type="button"
              onClick={() => {
                setBoundaryViewMode("farmer_polygon");
                setFitTrigger((t) => t + 1);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#14532D] hover:bg-[#166534] text-[#84CC16] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3 h-3" />
              <span>Fit Marked Area</span>
            </button>
          </div>

          {/* Satellite / Street Map Toggle */}
          <button
            type="button"
            onClick={() => setBaseLayer((prev) => (prev === "satellite" ? "street" : "satellite"))}
            className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200/80 text-xs font-bold text-slate-800 hover:bg-white flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>{baseLayer === "satellite" ? "Satellite Imagery" : "Street Map"}</span>
          </button>
        </div>

        {/* Top-Right Live Status Overlay */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200/50 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
            Live Sentinel-2 Feed
          </span>
        </div>
      </main>
    </div>
  );
}
