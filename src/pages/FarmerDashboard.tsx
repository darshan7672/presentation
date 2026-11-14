import React, { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import {
  Trees,
  MapPin,
  Upload,
  Calculator,
  DollarSign,
  History,
  CheckCircle2,
  Loader2,
  Navigation,
  ShieldCheck,
  Activity,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Info,
  Layers,
  Maximize2,
  TrendingUp,
  User,
  GraduationCap,
  Wallet,
  Building,
  CreditCard,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Home,
  Check,
  Compass,
  RotateCcw,
  Trash2,
  Ruler,
  Scan
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle, Polygon, Polyline } from "react-leaflet";
import L from "leaflet";
import * as turf from "@turf/turf";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import PortalLayout from "../components/PortalLayout";
import { Link, useSearchParams } from "react-router-dom";

// Fix Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const historyData = [
  { month: "Jan", credits: 12, earnings: 14400 },
  { month: "Feb", credits: 18, earnings: 21600 },
  { month: "Mar", credits: 28, earnings: 33600 },
  { month: "Apr", credits: 35, earnings: 42000 },
  { month: "May", credits: 48, earnings: 57600 },
  { month: "Jun", credits: 65, earnings: 78000 },
];

const WOOD_DENSITIES: Record<string, number> = {
  teak: 0.65,
  mahogany: 0.55,
  mango: 0.45,
  neem: 0.68,
  bamboo: 0.40,
  other: 0.50,
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);
  return null;
}

function FarmPolygonDrawer({
  position,
  setPosition,
  boundaryPoints,
  setBoundaryPoints,
  boundaryMode,
}: {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
  boundaryPoints: [number, number][];
  setBoundaryPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
  boundaryMode: "polygon" | "point";
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (boundaryMode === "polygon") {
        setBoundaryPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      } else {
        setPosition([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  useEffect(() => {
    if (position && boundaryPoints.length === 0) {
      map.flyTo(position, 16);
    }
  }, [position, map, boundaryPoints.length]);

  return (
    <>
      {/* Point Mode */}
      {boundaryMode === "point" && position && (
        <>
          <Marker position={position} />
          <Circle
            center={position}
            radius={100}
            pathOptions={{ color: "#16A34A", fillColor: "#16A34A", fillOpacity: 0.2 }}
          />
        </>
      )}

      {/* Polygon Mode */}
      {boundaryMode === "polygon" && (
        <>
          {/* Individual Vertices */}
          {boundaryPoints.map((pt, idx) => (
            <Circle
              key={`vertex-${idx}`}
              center={pt}
              radius={6}
              pathOptions={{
                color: "#14532D",
                fillColor: idx === 0 ? "#16A34A" : "#FFFFFF",
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}

          {/* Polyline while placing vertices */}
          {boundaryPoints.length >= 2 && boundaryPoints.length < 3 && (
            <Polyline
              positions={boundaryPoints}
              pathOptions={{ color: "#16A34A", weight: 3, dashArray: "4" }}
            />
          )}

          {/* Closed Polygon when >= 3 points */}
          {boundaryPoints.length >= 3 && (
            <Polygon
              positions={boundaryPoints}
              pathOptions={{
                color: "#16A34A",
                fillColor: "#22C55E",
                fillOpacity: 0.35,
                weight: 2.5,
              }}
            />
          )}

          {/* Centroid Marker */}
          {position && boundaryPoints.length >= 3 && (
            <Marker position={position} />
          )}
        </>
      )}
    </>
  );
}

export default function FarmerDashboard() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Registration & Calculation Form States
  const [regStep, setRegStep] = useState(1);
  const [area, setArea] = useState("12");
  const [trees, setTrees] = useState("450");
  const [gbh, setGbh] = useState("65");
  const [species, setSpecies] = useState("teak");
  const [farmingPractice, setFarmingPractice] = useState("Agroforestry");
  const [soilCarbonLevel, setSoilCarbonLevel] = useState("Medium (1.2% SOC)");
  const [soilType, setSoilType] = useState("Black Clay Loam");
  const [sequestration, setSequestration] = useState<number | null>(72.4);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<[number, number] | null>([22.5726, 88.3639]);

  // Polygon Boundary & Area Calculation States (Turf.js)
  const [boundaryPoints, setBoundaryPoints] = useState<[number, number][]>([
    [22.5740, 88.3623],
    [22.5742, 88.3654],
    [22.5712, 88.3657],
    [22.5710, 88.3621],
  ]);
  const [boundaryMode, setBoundaryMode] = useState<"polygon" | "point">("polygon");
  const [areaSqm, setAreaSqm] = useState<number | null>(48562);
  const [areaAcres, setAreaAcres] = useState<number | null>(12);
  const [farmBoundary, setFarmBoundary] = useState<any | null>(null);

  // Automatically calculate area in square metres & acres whenever boundaryPoints change using Turf.js
  useEffect(() => {
    if (boundaryPoints.length >= 3) {
      try {
        const ring = boundaryPoints.map((p) => [p[1], p[0]]); // GeoJSON expects [lng, lat]
        ring.push([boundaryPoints[0][1], boundaryPoints[0][0]]); // Close polygon ring

        const turfPoly = turf.polygon([ring]);
        const calculatedSqm = Math.round(turf.area(turfPoly));
        const calculatedAcres = parseFloat((calculatedSqm * 0.000247105).toFixed(2));
        const centroid = turf.centroid(turfPoly);
        const [cLng, cLat] = centroid.geometry.coordinates;

        setAreaSqm(calculatedSqm);
        setAreaAcres(calculatedAcres);
        setArea(String(calculatedAcres));
        setLocation([cLat, cLng]);
        setFarmBoundary(turfPoly.geometry);
      } catch (err) {
        console.warn("Turf area calculation error:", err);
      }
    }
  }, [boundaryPoints]);

  const handleUndoPoint = () => {
    setBoundaryPoints((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClearBoundary = () => {
    setBoundaryPoints([]);
    setFarmBoundary(null);
  };

  const handleFitSamplePolygon = () => {
    const centerLat = location ? location[0] : 22.5726;
    const centerLng = location ? location[1] : 88.3639;
    const dLat = 0.0018;
    const dLng = 0.0018;
    const samplePts: [number, number][] = [
      [centerLat + dLat, centerLng - dLng],
      [centerLat + dLat, centerLng + dLng],
      [centerLat - dLat, centerLng + dLng],
      [centerLat - dLat, centerLng - dLng],
    ];
    setBoundaryPoints(samplePts);
  };

  // Interactive UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateSuccess, setShowGenerateSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "street">("satellite");

  // Farmer Profile States
  const [farmerName, setFarmerName] = useState("Rameshwar Kisan");
  const [contactNumber, setContactNumber] = useState("+91 94251 88392");
  const [village, setVillage] = useState("Khedbrahma");
  const [district, setDistrict] = useState("Sabarkantha");
  const [state, setState] = useState("Gujarat");
  const [bankAccount, setBankAccount] = useState("•••• •••• •••• 4892");
  const [ifscCode, setIfscCode] = useState("SBIN0001248");
  const [upiId, setUpiId] = useState("rameshwar@upi");
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Registered projects list
  const [myFarms, setMyFarms] = useState<
    Array<{
      id: number;
      name: string;
      area: number;
      trees: number;
      species: string;
      practice: string;
      carbon: number;
      status: string;
      earnings: string;
      created_at?: string;
    }>
  >([
    {
      id: 101,
      name: "Sabarkantha Agroforestry Plot 1",
      area: 12,
      trees: 450,
      species: "Teak & Neem",
      practice: "Agroforestry",
      carbon: 72.4,
      status: "Approved",
      earnings: "₹1,08,600",
    },
    {
      id: 102,
      name: "Riverbank Soil Carbon Restoration",
      area: 8,
      trees: 280,
      species: "Mango & Bamboo",
      practice: "Regenerative Agro",
      carbon: 44.8,
      status: "Pending Verification",
      earnings: "Pending Verification",
    },
  ]);

  // Load Farmer Profile and Farms from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    async function loadFarmerSupabaseData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch profile from Supabase
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && isMounted) {
          if (profile.full_name) setFarmerName(profile.full_name);
          if (profile.phone) setContactNumber(profile.phone);
          if (profile.village) setVillage(profile.village);
          if (profile.district) setDistrict(profile.district);
          if (profile.state) setState(profile.state);
          if (profile.bank_account) setBankAccount(profile.bank_account);
          if (profile.ifsc_code) setIfscCode(profile.ifsc_code);
          if (profile.upi_id) setUpiId(profile.upi_id);
        }

        // 2. Fetch farms registered by this farmer
        const { data: farmsData, error: farmsError } = await supabase
          .from("farms")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: false });

        if (!farmsError && farmsData && farmsData.length > 0 && isMounted) {
          setMyFarms(
            farmsData.map((f: any) => ({
              id: f.id,
              name: f.farm_name || `${f.species ? f.species.toUpperCase() : "Farm"} Plot #${f.id}`,
              area: Number(f.area) || 0,
              trees: Number(f.trees) || 0,
              species: f.species || "Teak",
              practice: f.practice || "Agroforestry",
              carbon: Number(f.carbon) || 0,
              status:
                f.status === "approved"
                  ? "Approved"
                  : f.status === "rejected"
                  ? "Rejected"
                  : "Pending Verification",
              earnings:
                f.status === "approved"
                  ? `₹${((Number(f.carbon) || 0) * 1500).toLocaleString("en-IN")}`
                  : "Pending Verification",
              created_at: f.created_at,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading farmer data from Supabase:", err);
      }
    }

    loadFarmerSupabaseData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute dynamic stats from myFarms
  const totalArea = myFarms.reduce((sum, f) => sum + (Number(f.area) || 0), 0);
  const totalTrees = myFarms.reduce((sum, f) => sum + (Number(f.trees) || 0), 0);
  const approvedCredits = myFarms
    .filter((f) => f.status.toLowerCase() === "approved")
    .reduce((sum, f) => sum + (Number(f.carbon) || 0), 0);
  const pendingCredits = myFarms
    .filter((f) => f.status.toLowerCase() !== "approved")
    .reduce((sum, f) => sum + (Number(f.carbon) || 0), 0);
  const totalEarnings = Math.round(approvedCredits * 1500);

  const handleCalculate = () => {
    setError(null);

    const areaVal = parseFloat(area);
    const treesVal = parseFloat(trees);
    const gbhVal = parseFloat(gbh);

    if (isNaN(areaVal) || areaVal <= 0) {
      setError("Please enter a valid farm area in acres.");
      return false;
    }

    if (isNaN(treesVal) || treesVal <= 0) {
      setError("Please enter the number of trees planted.");
      return false;
    }

    let calculated = 0;
    if (farmingPractice === "Solar Farm") {
      calculated = treesVal * 1.2;
    } else {
      if (isNaN(gbhVal) || gbhVal <= 0) {
        setError("Please enter Girth at Breast Height (GBH in cm).");
        return false;
      }
      const density = WOOD_DENSITIES[species.toLowerCase()] || WOOD_DENSITIES.other;
      const dbh_cm = gbhVal / Math.PI;
      const agb_kg = density * 0.11 * Math.pow(dbh_cm, 2.62);
      const total_biomass_kg = agb_kg * 1.26;
      const carbon_kg = total_biomass_kg * 0.5;
      const co2_kg = carbon_kg * 3.666;
      calculated = (co2_kg * treesVal) / 1000;
    }

    setSequestration(Number(calculated.toFixed(2)));
    return true;
  };

  const handleUseMyLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation([position.coords.latitude, position.coords.longitude]);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      const calculatedCarbon = sequestration || 50;
      const farmPlotName = `${village || "Green"} Agroforestry Plot`;
      const numAcres = areaAcres || Number(area) || 0;
      const numSqm = areaSqm || Math.round(numAcres * 4046.856);

      let boundaryPayload = farmBoundary;
      if (!boundaryPayload && boundaryPoints.length >= 3) {
        boundaryPayload = {
          type: "Polygon",
          coordinates: [[
            ...boundaryPoints.map((p) => [p[1], p[0]]),
            [boundaryPoints[0][1], boundaryPoints[0][0]],
          ]],
        };
      }

      let insertedData: any = null;
      const { data, error: insertError } = await supabase
        .from("farms")
        .insert([
          {
            user_id: user?.id || null,
            farm_name: farmPlotName,
            area: numAcres,
            area_acres: numAcres,
            area_sqm: numSqm,
            farm_boundary: boundaryPayload || null,
            trees: Number(trees),
            carbon: calculatedCarbon,
            practice: farmingPractice,
            species: species,
            latitude: location?.[0] || 22.5726,
            longitude: location?.[1] || 88.3639,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (insertError) {
        // Fallback if optional polygon/name columns are not present in remote Supabase schema
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("farms")
          .insert([
            {
              user_id: user?.id || null,
              area: numAcres,
              trees: Number(trees),
              carbon: calculatedCarbon,
              practice: farmingPractice,
              species: species,
              latitude: location?.[0] || 22.5726,
              longitude: location?.[1] || 88.3639,
              status: "pending",
            },
          ])
          .select()
          .single();

        if (fallbackError) {
          console.warn("Supabase farm insert blocked (saving locally):", fallbackError.message);
          insertedData = { id: Date.now(), status: "pending" };
        } else {
          insertedData = fallbackData;
        }
      } else {
        insertedData = data;
      }

      const savedFarmId = insertedData?.id || Date.now();

      // Persist polygon boundary & telemetry in localStorage so Admin Satellite Monitor always has exact vertices
      try {
        const storedMap = JSON.parse(localStorage.getItem("carbonx_farm_boundaries") || "{}");
        storedMap[String(savedFarmId)] = {
          farm_id: savedFarmId,
          farm_name: farmPlotName,
          farmer_name: farmerName,
          village: village,
          district: district,
          state: state,
          area_acres: numAcres,
          area_sqm: numSqm,
          farm_boundary: boundaryPayload || null,
          vertices: boundaryPoints,
          latitude: location?.[0] || 22.5726,
          longitude: location?.[1] || 88.3639,
          trees: Number(trees),
          species: species,
          practice: farmingPractice,
          carbon: calculatedCarbon,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("carbonx_farm_boundaries", JSON.stringify(storedMap));
      } catch (storageErr) {
        console.warn("Could not cache farm boundary locally:", storageErr);
      }

      setIsGenerating(false);
      setShowGenerateSuccess(true);

      // Add to local projects state with the real Supabase ID
      const newFarm = {
        id: savedFarmId,
        name: farmPlotName,
        area: numAcres,
        area_acres: numAcres,
        area_sqm: numSqm,
        farm_boundary: boundaryPayload || null,
        trees: Number(trees),
        species: species,
        practice: farmingPractice,
        carbon: calculatedCarbon,
        status: "Pending Verification",
        earnings: "Pending Verification",
      };
      setMyFarms((prev) => [newFarm, ...prev]);

      setTimeout(() => {
        setShowGenerateSuccess(false);
        setActiveTab("projects");
      }, 1800);
    } catch (err: any) {
      console.error("ERROR:", err);
      setError(err?.message || "Failed to submit farm registration");
      setIsGenerating(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in as a farmer to save your profile to Supabase.");
        setIsSavingProfile(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          role: "farmer",
          full_name: farmerName,
          phone: contactNumber,
          village: village,
          district: district,
          state: state,
          bank_account: bankAccount,
          ifsc_code: ifscCode,
          upi_id: upiId,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Supabase profile save error:", profileError);
        alert("Error saving profile to Supabase: " + profileError.message);
      } else {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      alert("Error saving profile: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(true);
      }, 1500);
    }
  };

  return (
    <PortalLayout
      portalRole="farmer"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={
        activeTab === "dashboard"
          ? "Farmer Impact & Earnings Overview"
          : activeTab === "registration"
          ? "Register New Farm Land & Trees"
          : activeTab === "calculator"
          ? "Carbon Sequestration Estimator"
          : activeTab === "profile"
          ? "Farmer Profile & Direct Bank Details"
          : activeTab === "projects"
          ? "My Registered Farms & Verified Carbon Credits"
          : activeTab === "wallet"
          ? "Earnings, Payments & Wallet"
          : "Farmer Settings"
      }
      subtitle={
        activeTab === "dashboard"
          ? "Track your tree plantation, approved carbon credits, and guaranteed direct payouts."
          : activeTab === "registration"
          ? "Simple step-by-step registration for your farm to qualify for carbon income."
          : activeTab === "calculator"
          ? "Estimate how much carbon your trees and soil store, and how much money you can earn."
          : activeTab === "profile"
          ? "Secure bank account details for direct benefit transfers (DBT) when credits are sold."
          : "Monitor verification status and satellite monitoring for all your plots."
      }
      actions={
        <div className="flex items-center gap-2.5">
          {activeTab !== "registration" && (
            <button
              onClick={() => setActiveTab("registration")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Trees className="w-4 h-4 text-white" />
              <span>Register New Farm</span>
            </button>
          )}
          <Link
            to="/training"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] hover:bg-[#F8FAF7] transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-[#16A34A]" />
            <span>Training Guides</span>
          </Link>
        </div>
      }
    >
      {/* ===================== TAB 1: DASHBOARD ===================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {/* Welcome Banner with clear language */}
          <div className="bg-gradient-to-r from-[#14532D] to-[#166534] text-white rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-[#84CC16]">
                  Verified Agroforestry Partner
                </span>
              </div>
              <h2 className="text-xl font-display font-extrabold tracking-tight">
                Namaste, {farmerName}!
              </h2>
              <p className="text-xs text-white/85 mt-1 max-w-xl font-medium">
                Your trees are healthy and actively absorbing carbon. You have {myFarms.length} registered {myFarms.length === 1 ? "farm" : "farms"} in Supabase.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("wallet")}
                className="px-4 py-2 rounded-lg bg-[#84CC16] hover:bg-[#65A30D] text-[#14532D] font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>View Wallet (₹{totalEarnings.toLocaleString("en-IN")})</span>
              </button>
            </div>
          </div>

          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Farm Area */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Total Farm Area
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#14532D] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  {totalArea > 0 ? totalArea.toFixed(1) : "0.0"}
                </span>
                <span className="text-xs font-semibold text-[#64748B]">Acres</span>
              </div>
              <p className="text-xs text-[#16A34A] font-semibold mt-2.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {myFarms.length} {myFarms.length === 1 ? "Plot" : "Plots"} Geotagged
              </p>
            </div>

            {/* Total Trees Planted */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Total Trees
                </span>
                <div className="w-9 h-9 rounded-lg bg-lime-50 text-[#16A34A] flex items-center justify-center">
                  <Trees className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  {totalTrees.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-[#64748B]">Trees</span>
              </div>
              <p className="text-xs text-[#64748B] mt-2.5">Agroforestry & Carbon Plantation</p>
            </div>

            {/* Approved Carbon Credits */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Approved Carbon Credits
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#16A34A] tracking-tight">
                  {approvedCredits.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-[#64748B]">tCO₂e (CC)</span>
              </div>
              <p className="text-xs text-amber-700 font-semibold mt-2.5">
                +{pendingCredits.toFixed(1)} CC Pending Inspection
              </p>
            </div>

            {/* Total Earnings */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Total Earnings
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#14532D] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#14532D] tracking-tight">
                  ₹{totalEarnings.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-xs text-[#16A34A] font-semibold mt-2.5">
                Direct Benefit Transfer to your bank
              </p>
            </div>
          </div>

          {/* Growth & Carbon Impact Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Carbon Growth */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">
                    Carbon Credits Generated Over Time
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    As your trees grow in height and girth, carbon sequestration accelerates.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  +18% Monthly Growth
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="farmerCarbon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" CC" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="credits"
                      stroke="#16A34A"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#farmerCarbon)"
                      name="Carbon Credits (tCO₂e)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Farm Health & Tasks */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Farm Health Checklist</h3>
                <p className="text-xs text-[#64748B] mb-4">
                  Actions to keep your carbon certification active.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#14532D]">GPS Boundary Mapped</p>
                      <p className="text-[#64748B] text-[11px]">Satellite imagery matched successfully.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#14532D]">Bank Details Verified</p>
                      <p className="text-[#64748B] text-[11px]">State Bank of India (Ending in 4892).</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Quarterly Tree Photo Upload</p>
                      <p className="text-amber-800 text-[11px]">Due in 14 days for second farm plot.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("registration")}
                className="w-full mt-4 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trees className="w-4 h-4 text-[#84CC16]" />
                <span>Add Another Farm Plot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: FARM REGISTRATION ===================== */}
      {activeTab === "registration" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs">
            {/* Step Wizard Header */}
            <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB] mb-8">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">Farm & Tree Registration</h2>
                <p className="text-xs text-[#64748B]">
                  Step {regStep} of 3 &bull; Fill clear details about your land to calculate carbon revenue.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      regStep === stepNum
                        ? "bg-[#14532D] text-white"
                        : regStep > stepNum
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-[#F8FAF7] text-[#64748B] border border-[#E5E7EB]"
                    }`}
                  >
                    {regStep > stepNum ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {showGenerateSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
                <span>Farm submitted successfully! Sent for admin satellite verification.</span>
              </div>
            )}

            {/* STEP 1: Practice, Land Size & Location */}
            {regStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-2">
                    Farming Practice Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "Agroforestry", title: "Agroforestry", desc: "Crops combined with timber or fruit trees" },
                      { id: "Regenerative Agro", title: "Soil Regeneration", desc: "No-till, cover cropping & biochar" },
                      { id: "Solar Farm", title: "Agri-Solar Farm", desc: "Solar panels with shaded farming underneath" },
                    ].map((practice) => (
                      <button
                        type="button"
                        key={practice.id}
                        onClick={() => setFarmingPractice(practice.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          farmingPractice === practice.id
                            ? "border-[#16A34A] bg-emerald-50/40 ring-2 ring-[#16A34A]/20"
                            : "border-[#E5E7EB] bg-[#F8FAF7] hover:bg-white"
                        }`}
                      >
                        <p className="text-xs font-bold text-[#1F2937]">{practice.title}</p>
                        <p className="text-[11px] text-[#64748B] mt-1">{practice.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1">
                      Farm Area (in Acres) *
                      {areaSqm && (
                        <span className="text-[10px] text-[#16A34A] font-semibold ml-1.5">
                          ({areaSqm.toLocaleString()} m² via Turf.js)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      required
                      step="any"
                      min="0.1"
                      value={area}
                      onChange={(e) => {
                        const val = e.target.value;
                        setArea(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed) && parsed > 0) {
                          setAreaAcres(parsed);
                          setAreaSqm(Math.round(parsed * 4046.856));
                        }
                      }}
                      placeholder="e.g. 15"
                      className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                    />
                    <p className="text-[10px] text-[#64748B] mt-1">
                      Auto-calculated when marking polygon boundary on the map below.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1">
                      Soil Type
                    </label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                    >
                      <option value="Black Clay Loam">Black Clay Loam (Regur)</option>
                      <option value="Alluvial Soil">Alluvial Sandy Loam</option>
                      <option value="Red Sandy Loam">Red Sandy Loam</option>
                      <option value="Laterite Soil">Laterite Soil</option>
                    </select>
                  </div>
                </div>

                {/* Farm Polygon Boundary & Area Calculation Map Drawer */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                        <Scan className="w-4 h-4 text-[#16A34A]" />
                        <span>Interactive Farm Boundary & Polygon Drawer</span>
                      </label>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Click points on the map perimeter to draw your boundary. Turf.js computes exact m² and acres.
                      </p>
                    </div>

                    {/* Mode & Satellite Toggles */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-lg border border-[#E5E7EB] p-0.5 bg-[#F8FAF7] text-xs">
                        <button
                          type="button"
                          onClick={() => setBoundaryMode("polygon")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            boundaryMode === "polygon"
                              ? "bg-[#14532D] text-white shadow-xs"
                              : "text-[#64748B] hover:text-[#1F2937]"
                          }`}
                        >
                          Draw Boundary
                        </button>
                        <button
                          type="button"
                          onClick={() => setBoundaryMode("point")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            boundaryMode === "point"
                              ? "bg-[#14532D] text-white shadow-xs"
                              : "text-[#64748B] hover:text-[#1F2937]"
                          }`}
                        >
                          Single Point
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setMapType(mapType === "satellite" ? "street" : "satellite")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#14532D] hover:bg-[#F8FAF7] shadow-2xs"
                        title="Toggle satellite / street tiles"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>{mapType === "satellite" ? "Satellite" : "Street"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Polygon Action Toolbar */}
                  {boundaryMode === "polygon" && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F8FAF7] border border-[#E5E7EB] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <Check className="w-3 h-3 text-[#16A34A]" />
                          {boundaryPoints.length} Points Marked
                        </span>
                        <span className="text-[11px] text-[#64748B] hidden sm:inline">
                          {boundaryPoints.length < 3
                            ? "Mark at least 3 points to complete boundary"
                            : "Boundary polygon closed"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleUseMyLocation}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] hover:bg-emerald-50 rounded text-[11px] font-semibold text-[#14532D] transition-colors"
                        >
                          <Navigation className="w-3 h-3 text-[#16A34A]" />
                          <span>{isLocating ? "Locating..." : "My GPS"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleFitSamplePolygon}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] hover:bg-emerald-50 rounded text-[11px] font-semibold text-[#14532D] transition-colors"
                          title="Generate a starter parcel shape around current GPS"
                        >
                          <Ruler className="w-3 h-3 text-[#16A34A]" />
                          <span>Auto-Fit Parcel</span>
                        </button>

                        {boundaryPoints.length > 0 && (
                          <button
                            type="button"
                            onClick={handleUndoPoint}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] hover:bg-slate-100 rounded text-[11px] font-semibold text-[#64748B] transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Undo</span>
                          </button>
                        )}

                        {boundaryPoints.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearBoundary}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-200 hover:bg-red-50 rounded text-[11px] font-semibold text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Leaflet Map Container */}
                  <div className="h-72 w-full rounded-xl overflow-hidden border border-[#E5E7EB] relative shadow-2xs">
                    <MapContainer
                      center={location || [20.5937, 78.9629]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <MapResizer />
                      {mapType === "satellite" ? (
                        <TileLayer
                          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                          maxZoom={18}
                        />
                      ) : (
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                      )}
                      <FarmPolygonDrawer
                        position={location}
                        setPosition={setLocation}
                        boundaryPoints={boundaryPoints}
                        setBoundaryPoints={setBoundaryPoints}
                        boundaryMode={boundaryMode}
                      />
                    </MapContainer>
                  </div>

                  {/* Turf.js Live Area Metrics Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">
                        Calculated Area (m²)
                      </span>
                      <span className="font-bold font-mono text-[#14532D] text-sm">
                        {areaSqm ? `${areaSqm.toLocaleString()} m²` : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">
                        Calculated Acres
                      </span>
                      <span className="font-bold font-mono text-[#16A34A] text-sm">
                        {areaAcres ? `${areaAcres.toFixed(2)} Acres` : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">
                        Farm Centroid GPS
                      </span>
                      <span className="font-mono text-[#1F2937] text-[11px] truncate block">
                        {location ? `${location[0].toFixed(4)}, ${location[1].toFixed(4)}` : "Not Selected"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">
                        Polygon Ring
                      </span>
                      <span className="font-semibold text-emerald-900 text-xs">
                        {boundaryPoints.length >= 3 ? "GeoJSON Valid" : "Mark Perimeter"}
                      </span>
                    </div>
                  </div>

                  {/* Land Records Cadastral Disclaimer */}
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-amber-950">Boundary Measurement Notice:</strong> This measurement provides an automated surface area based on the digital polygon perimeter marked by the farmer, not a legally surveyed cadastral land measurement. Official carbon credit verification and certification require field audit verification against registered land records and satellite remote-sensing MRV.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!area || !location) {
                        setError("Please enter farm area and select location.");
                        return;
                      }
                      setError(null);
                      setRegStep(2);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Next: Tree Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Trees & Measurement Details */}
            {regStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1">
                      Number of Trees *
                    </label>
                    <input
                      type="number"
                      required
                      value={trees}
                      onChange={(e) => setTrees(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1">
                      Tree Species *
                    </label>
                    <select
                      value={species}
                      onChange={(e) => setSpecies(e.target.value)}
                      className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                    >
                      <option value="teak">Teak (High Wood Density)</option>
                      <option value="neem">Neem (Medicinal / Dense)</option>
                      <option value="mahogany">Mahogany (Hardwood)</option>
                      <option value="mango">Mango (Fruit Agroforestry)</option>
                      <option value="bamboo">Bamboo (Fast Sequestration)</option>
                      <option value="other">Mixed Native Species</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1">
                      Average Tree GBH (cm) *
                    </label>
                    <input
                      type="number"
                      required
                      value={gbh}
                      onChange={(e) => setGbh(e.target.value)}
                      placeholder="Girth at breast height e.g. 65"
                      className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                    />
                    <p className="text-[10px] text-[#64748B] mt-1">Measure trunk circumference at 1.3m height</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    Soil Organic Carbon (SOC)
                  </label>
                  <select
                    value={soilCarbonLevel}
                    onChange={(e) => setSoilCarbonLevel(e.target.value)}
                    className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                  >
                    <option value="High (> 1.5% SOC)">High Organic Matter (&gt; 1.5% SOC)</option>
                    <option value="Medium (1.2% SOC)">Medium Organic Matter (1.0% - 1.5% SOC)</option>
                    <option value="Low (< 0.8% SOC)">Low / Degraded Land (&lt; 0.8% SOC)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="px-5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1F2937]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!handleCalculate()) return;
                      setRegStep(3);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <span>Calculate Carbon & Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Document Upload */}
            {regStep === 3 && (
              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#14532D]">
                        Estimated Carbon Sequestration
                      </span>
                      <p className="text-3xl font-display font-extrabold text-[#14532D] mt-1">
                        {sequestration} <span className="text-sm font-semibold text-emerald-800">tCO₂e / Year</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Potential Annual Income
                      </span>
                      <p className="text-2xl font-display font-extrabold text-[#16A34A] mt-1">
                        ₹{Math.round((sequestration || 50) * 1500).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload land docs & photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-dashed border-[#E5E7EB] rounded-xl text-center bg-[#F8FAF7]">
                    <Upload className="w-6 h-6 text-[#16A34A] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1F2937]">Upload Land Records (7/12 or Khasra)</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">PDF or photo proof of ownership</p>
                    <label className="mt-3 inline-block px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#14532D] cursor-pointer hover:bg-slate-50">
                      Choose File
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="p-4 border border-dashed border-[#E5E7EB] rounded-xl text-center bg-[#F8FAF7]">
                    <Trees className="w-6 h-6 text-[#14532D] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1F2937]">Farm Photos (Trees & Crops)</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Helps fast-track verification</p>
                    <label className="mt-3 inline-block px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#14532D] cursor-pointer hover:bg-slate-50">
                      Upload Photos
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {uploadSuccess && (
                  <p className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Documents attached successfully!
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="px-5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1F2937]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Farm Registration...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-[#84CC16]" />
                        <span>Confirm & Submit for Carbon Credits</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: CARBON CALCULATOR ===================== */}
      {activeTab === "calculator" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#1F2937]">
                How is your Carbon Sequestration Calculated?
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                We use the Indian Council of Forestry Research & Education (ICFRE) and IPCC allometric biomass equations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F8FAF7] rounded-xl border border-[#E5E7EB]">
                <span className="font-bold text-[#14532D] block mb-1">1. Tree Biomass Method</span>
                <p className="text-[#64748B] leading-relaxed">
                  Trunk girth (GBH) is used to find tree diameter (DBH = GBH / &pi;). Wood density determines Above Ground Biomass (AGB), which contains ~50% pure carbon.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAF7] rounded-xl border border-[#E5E7EB]">
                <span className="font-bold text-[#14532D] block mb-1">2. CO₂ Equivalent Conversion</span>
                <p className="text-[#64748B] leading-relaxed">
                  Every 1 kg of carbon captured in timber corresponds to 3.666 kg of atmospheric CO₂ removed from the air. 1 Carbon Credit = 1 Metric Ton (1000 kg) of CO₂e.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                <p className="text-amber-900 leading-relaxed">
                  <strong>Important Notice:</strong> Estimated Sequestration represents potential CO₂ uptake. Carbon credits are formally minted and sold only after independent admin satellite audit and field validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: MY PROFILE & BANK ===================== */}
      {activeTab === "profile" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Farmer Profile & Bank KYC</h3>
                <p className="text-xs text-[#64748B]">
                  Used for verified direct payments whenever your carbon credits are purchased by industries.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                KYC 100% Complete
              </span>
            </div>

            {profileSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-[#14532D] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Profile and bank details saved successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#1F2937] mb-1">Farmer Full Name</label>
                <input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2937] mb-1">Mobile Number (Aadhaar Linked)</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2937] mb-1">Village & Gram Panchayat</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2937] mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937]"
                  placeholder="e.g. Sabarkantha"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2937] mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937]"
                  placeholder="e.g. Gujarat"
                />
              </div>
            </div>

            {/* Bank details */}
            <div className="p-5 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB] space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#16A34A]" />
                <h4 className="text-xs font-bold text-[#1F2937]">Secure Bank Details (Direct Benefit Transfer)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold"
                    placeholder="Account Number"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold"
                    placeholder="e.g. SBIN0001248"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#64748B] mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono font-bold"
                    placeholder="farmer@upi"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={handleSaveProfile}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#84CC16]" />
                    <span>Save to Supabase Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: MY PROJECTS ===================== */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">My Registered Farm Plots</h3>
                <p className="text-xs text-[#64748B]">All submitted plots undergoing satellite & ground MRV verification.</p>
              </div>
              <button
                onClick={() => setActiveTab("registration")}
                className="px-4 py-2 bg-[#16A34A] text-white rounded-lg text-xs font-semibold hover:bg-[#15803D]"
              >
                + Register New Farm
              </button>
            </div>

            {myFarms.length === 0 ? (
              <div className="p-12 text-center bg-[#F8FAF7]">
                <Trees className="w-12 h-12 text-[#16A34A] mx-auto mb-3 opacity-60" />
                <h4 className="text-sm font-bold text-[#1F2937]">No Farm Plots Registered Yet</h4>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                  Register your first agricultural land to begin calculating tree biomass and qualifying for carbon credit income.
                </p>
                <button
                  onClick={() => setActiveTab("registration")}
                  className="mt-4 px-5 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white rounded-lg text-xs font-bold"
                >
                  Register First Farm Land
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {myFarms.map((farm) => (
                  <div key={farm.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-emerald-50/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1F2937]">{farm.name}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            farm.status === "Approved"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {farm.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] flex flex-wrap items-center gap-2">
                        <span>
                          {farm.area_acres ? `${Number(farm.area_acres).toFixed(2)} Acres` : `${farm.area} Acres`}
                          {farm.area_sqm ? ` (${Number(farm.area_sqm).toLocaleString()} m²)` : ""}
                        </span>
                        <span>&bull;</span>
                        <span>{farm.trees} Trees</span>
                        <span>&bull;</span>
                        <span>Species: {farm.species}</span>
                        {farm.farm_boundary && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                            ✓ Polygon Boundary Mapped
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <span className="text-[#64748B] block text-[10px] font-bold uppercase">Carbon Credits</span>
                        <span className="font-bold text-[#14532D] text-sm">{farm.carbon} CC</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px] font-bold uppercase">Payout Status</span>
                        <span className="font-bold text-[#16A34A] text-sm">{farm.earnings}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 6: EARNINGS & WALLET ===================== */}
      {activeTab === "wallet" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Total Earnings</span>
              <p className="text-3xl font-display font-extrabold text-[#14532D] mt-2">
                ₹{totalEarnings.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-[#16A34A] font-semibold mt-1">
                {approvedCredits.toFixed(1)} Credits Approved & Sold
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Withdrawable Balance</span>
              <p className="text-3xl font-display font-extrabold text-[#16A34A] mt-2">
                ₹{Math.round(totalEarnings * 0.3).toLocaleString("en-IN")}
              </p>
              <button
                onClick={() => alert(`Withdrawal request of ₹${Math.round(totalEarnings * 0.3).toLocaleString("en-IN")} initiated to your ${ifscCode || "DBT"} bank account.`)}
                className="mt-2 text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] px-3 py-1 rounded transition-colors"
              >
                Withdraw to Bank
              </button>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Pending Verification</span>
              <p className="text-3xl font-display font-extrabold text-amber-700 mt-2">
                ₹{Math.round(pendingCredits * 1500).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-[#64748B] mt-1">{pendingCredits.toFixed(1)} CC awaiting inspection</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h4 className="text-sm font-bold text-[#1F2937] mb-4">Recent Credit Payout Transactions</h4>
            <div className="divide-y divide-[#E5E7EB] text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1F2937]">Retired 40.0 Credits &bull; Tata Steel Green Initiatives</p>
                  <p className="text-[10px] text-[#64748B]">Transferred via NEFT to SBI A/C ending 4892</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#16A34A]">+₹60,000</p>
                  <p className="text-[10px] text-[#64748B]">Apr 12, 2026</p>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1F2937]">Retired 32.4 Credits &bull; Adani Renewables Cluster</p>
                  <p className="text-[10px] text-[#64748B]">Transferred via IMPS to SBI A/C ending 4892</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#16A34A]">+₹48,600</p>
                  <p className="text-[10px] text-[#64748B]">Mar 26, 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 7: SETTINGS ===================== */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs space-y-5 text-xs">
          <h3 className="text-base font-bold text-[#1F2937] pb-4 border-b border-[#E5E7EB]">
            Farmer Preferences
          </h3>

          <div className="flex items-center justify-between p-4 bg-[#F8FAF7] rounded-lg">
            <div>
              <p className="font-bold text-[#1F2937]">SMS Notifications on Mobile</p>
              <p className="text-[#64748B] text-[11px]">Receive Hindi / English SMS when carbon credits are purchased.</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#16A34A]" />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F8FAF7] rounded-lg">
            <div>
              <p className="font-bold text-[#1F2937]">Language Preference</p>
              <p className="text-[#64748B] text-[11px]">Default interface language.</p>
            </div>
            <select className="bg-white border border-[#E5E7EB] rounded px-3 py-1.5 font-semibold">
              <option>English</option>
              <option>हिन्दी (Hindi)</option>
              <option>ગુજરાતી (Gujarati)</option>
              <option>मराठी (Marathi)</option>
            </select>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
