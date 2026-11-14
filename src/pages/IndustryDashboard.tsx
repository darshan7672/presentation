import React, { useState, FormEvent, useEffect, useMemo } from "react";
import {
  Factory,
  Zap,
  Fuel,
  Activity,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Calendar,
  Download,
  Plus,
  TrendingDown,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  FileText,
  AlertCircle,
  Truck,
  Leaf,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Copy,
  Check,
  Filter,
  History,
  Clock,
  ArrowUpDown,
  Info
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import PortalLayout from "../components/PortalLayout";

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

// Fix for Leaflet default marker icon issue
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const initialPortfolioLocations = [
  { id: 1, name: "Agroforestry Initiative", location: "Punjab, India", coords: [31.1471, 75.3412] as [number, number], credits: 150 },
  { id: 2, name: "Solar Farm Integration", location: "Gujarat, India", coords: [22.2587, 71.1924] as [number, number], credits: 175 },
];

const emissionTrendsData = [
  { month: "Jan", emissions: 120, offsets: 20, net: 100 },
  { month: "Feb", emissions: 130, offsets: 30, net: 100 },
  { month: "Mar", emissions: 110, offsets: 45, net: 65 },
  { month: "Apr", emissions: 140, offsets: 50, net: 90 },
  { month: "May", emissions: 125, offsets: 80, net: 45 },
  { month: "Jun", emissions: 115, offsets: 100, net: 15 },
  { month: "Jul", emissions: 108, offsets: 95, net: 13 },
  { month: "Aug", emissions: 98, offsets: 90, net: 8 },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface IndustryEmissionRecord {
  id: string;
  industry_id: string;
  report_month: string;
  report_year: number;
  electricity: number;
  fuel: number;
  transport: number;
  production_tons: number;
  total_emission: number;
  submitted_at: string;
  created_at?: string;
  updated_at?: string;
}

const currentDate = new Date();

export default function IndustryDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Emission Calculator States
  const [electricity, setElectricity] = useState("12000");
  const [fuel, setFuel] = useState("450");
  const [transport, setTransport] = useState("1800");
  const [productionTons, setProductionTons] = useState("250");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [emissions, setEmissions] = useState<number | null>(11.23);
  const [emissionRecord, setEmissionRecord] = useState<{
    company: string;
    month: string;
    year: string;
    electricity: number;
    fuel: number;
    transport: number;
  } | null>(null);

  const [portfolioLocations, setPortfolioLocations] = useState(initialPortfolioLocations);
  const [calculating, setCalculating] = useState(false);
  const [calcSuccess, setCalcSuccess] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Multiple Emission Submissions & History State
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<IndustryEmissionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterMonth, setHistoryFilterMonth] = useState<string>("all");
  const [historyFilterYear, setHistoryFilterYear] = useState<string>("all");
  const [historySortOrder, setHistorySortOrder] = useState<"desc" | "asc">("desc");
  const [copiedSubmissionId, setCopiedSubmissionId] = useState<string | null>(null);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);

  // Industry Profile Summary
  const [companyInfo, setCompanyInfo] = useState({
    name: "Tata Steel Green Initiatives Ltd.",
    type: "Heavy Manufacturing & Materials",
    gst: "27AAACT2727Q1ZW",
    regNo: "CIN-U27100MH2020PLC123456",
    contactPerson: "Dr. Arvind Mehta",
    email: "sustainability@tatagreen.com",
    city: "Mumbai, Maharashtra",
    netZeroTarget: "2035",
    renewablePct: "38%",
  });

  // Recent Purchases & Transactions Mock
  const [purchases, setPurchases] = useState([
    {
      id: "CX-ORD-90214",
      date: "2026-04-12",
      project: "Western Ghats Agroforestry Bio-Carbon",
      farmer: "Rameshwar Patil & Co-Op",
      quantity: 150,
      pricePerTon: 22.0,
      totalCost: 3465.0,
      status: "Retired / Verified",
      certificateId: "CX-CERT-2026-00481",
    },
    {
      id: "CX-ORD-88192",
      date: "2026-03-24",
      project: "Gujarat Solar Microgrid Co-Op",
      farmer: "Saurashtra Farmer Cluster",
      quantity: 175,
      pricePerTon: 18.5,
      totalCost: 3400.0,
      status: "Retired / Verified",
      certificateId: "CX-CERT-2026-00329",
    },
  ]);

  // Copy UUID to clipboard
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedSubmissionId(id);
    setTimeout(() => setCopiedSubmissionId(null), 2000);
  };

  // Format timestamp helper
  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  // Fetch all historical submissions for this industry from Supabase
  const fetchSubmissions = async (targetId?: string) => {
    const idToUse = targetId || industryId;
    if (!idToUse) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("industry_emissions")
        .select("*")
        .eq("industry_id", idToUse)
        .order("submitted_at", { ascending: false });

      if (error) {
        console.warn("Error fetching emissions history:", error);
      } else if (data) {
        setSubmissions(data as IndustryEmissionRecord[]);
      }
    } catch (err) {
      console.warn("Could not load submissions:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load user profile, industry ID, and existing emissions on mount
  useEffect(() => {
    const fetchApprovedFarms = async () => {
      try {
        const { data, error } = await supabase
          .from("farms")
          .select("*")
          .eq("status", "approved");

        if (!error && data && data.length > 0) {
          const approvedProjects = data.map((farmer) => {
            const farmerName = `Farmer #${farmer.id}`;
            const farmerLocation =
              farmer.latitude && farmer.longitude
                ? `${farmer.latitude.toFixed(4)}, ${farmer.longitude.toFixed(4)}`
                : "India";

            return {
              id: farmer.id + 1000,
              name: `${farmerName} Project`,
              location: farmerLocation,
              coords: [farmer.latitude || 20.5937, farmer.longitude || 78.9629] as [number, number],
              credits: farmer.carbon || 0,
            };
          });

          setPortfolioLocations([...initialPortfolioLocations, ...approvedProjects]);
        }
      } catch (e) {
        console.warn("Could not load farms from Supabase:", e);
      }
    };

    const fetchIndustryInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: ind } = await supabase
            .from("industries")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (ind) {
            setIndustryId(ind.id);
            setCompanyInfo({
              name: ind.company_name || companyInfo.name,
              type: ind.industry_type || companyInfo.type,
              gst: ind.gst_number || companyInfo.gst,
              regNo: ind.registration_number || companyInfo.regNo,
              contactPerson: ind.contact_person || companyInfo.contactPerson,
              email: ind.email || user.email || companyInfo.email,
              city: `${ind.city || "Mumbai"}, ${ind.state || "Maharashtra"}`,
              netZeroTarget: "2035",
              renewablePct: "42%",
            });
            await fetchSubmissions(ind.id);
          }
        } else {
          // If no active auth session (demo or direct preview), check if any industry exists
          const { data: fallbackInd } = await supabase
            .from("industries")
            .select("*")
            .limit(1)
            .maybeSingle();
          if (fallbackInd) {
            setIndustryId(fallbackInd.id);
            await fetchSubmissions(fallbackInd.id);
          }
        }
      } catch (err) {
        console.warn("Error fetching industry info:", err);
      }
    };

    fetchApprovedFarms();
    fetchIndustryInfo();
  }, []);

  // Process all submissions: Identify the latest official report for each distinct month & year
  // Multiple submissions for the same month are NEVER summed together.
  const processedSubmissions = useMemo(() => {
    const latestByPeriod = new Map<string, string>();
    const countByPeriod = new Map<string, number>();

    // Deterministic sort by submitted_at DESC
    const sorted = [...submissions].sort(
      (a, b) => new Date(b.submitted_at || b.created_at || 0).getTime() - new Date(a.submitted_at || a.created_at || 0).getTime()
    );

    sorted.forEach((sub) => {
      const key = `${sub.report_year}-${(sub.report_month || "").toLowerCase()}`;
      if (!latestByPeriod.has(key)) {
        latestByPeriod.set(key, sub.id);
      }
      countByPeriod.set(key, (countByPeriod.get(key) || 0) + 1);
    });

    return sorted.map((sub) => {
      const key = `${sub.report_year}-${(sub.report_month || "").toLowerCase()}`;
      const isOfficialLatest = latestByPeriod.get(key) === sub.id;
      const totalRevisions = countByPeriod.get(key) || 1;
      return {
        ...sub,
        isOfficialLatest,
        totalRevisions,
      };
    });
  }, [submissions]);

  // Filtered and sorted submissions for the UI history table
  const filteredSubmissions = useMemo(() => {
    let list = processedSubmissions.filter((sub) => {
      if (historyFilterMonth !== "all" && (sub.report_month || "").toLowerCase() !== historyFilterMonth.toLowerCase()) {
        return false;
      }
      if (historyFilterYear !== "all" && String(sub.report_year) !== historyFilterYear) {
        return false;
      }
      return true;
    });

    if (historySortOrder === "asc") {
      list = [...list].sort(
        (a, b) => new Date(a.submitted_at || a.created_at || 0).getTime() - new Date(b.submitted_at || b.created_at || 0).getTime()
      );
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.submitted_at || b.created_at || 0).getTime() - new Date(a.submitted_at || a.created_at || 0).getTime()
      );
    }

    return list;
  }, [processedSubmissions, historyFilterMonth, historyFilterYear, historySortOrder]);

  // Official Monthly Summary for currently selected Month & Year in Calculator
  const currentPeriodOfficial = useMemo(() => {
    const key = `${selectedYear}-${(selectedMonth || "").toLowerCase()}`;
    const periodSubs = processedSubmissions.filter(
      (s) => `${s.report_year}-${(s.report_month || "").toLowerCase()}` === key
    );
    const official = periodSubs.find((s) => s.isOfficialLatest);
    return {
      official,
      totalSubmissions: periodSubs.length,
      historicalRevisionsCount: Math.max(0, periodSubs.length - 1),
    };
  }, [processedSubmissions, selectedMonth, selectedYear]);

  // Available years from submissions for filter dropdown
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    submissions.forEach((s) => {
      if (s.report_year) years.add(String(s.report_year));
    });
    years.add(selectedYear);
    years.add("2026");
    years.add("2025");
    return Array.from(years).sort().reverse();
  }, [submissions, selectedYear]);

  // Emission submission handler: Uses explicit INSERT, never UPSERT
  const handleCalculate = async (e: FormEvent) => {
    e.preventDefault();
    if (calculating) return; // Prevent duplicate rapid submission clicks

    setCalculating(true);
    setCalcError(null);
    setCalcSuccess(false);

    const calcElectricity = parseFloat(electricity) || 0;
    const calcFuel = parseFloat(fuel) || 0;
    const calcTransport = parseFloat(transport) || 0;
    const calcProduction = parseFloat(productionTons) || 0;

    if (calcElectricity < 0 || calcFuel < 0 || calcTransport < 0 || calcProduction < 0) {
      setCalcError("Resource consumption inputs cannot be negative values.");
      setCalculating(false);
      return;
    }

    // Calculation factors:
    // Electricity: 0.82 kgCO2/kWh
    // Fuel (Diesel/Oil): 2.68 kgCO2/L
    // Transport: 0.21 kgCO2/km
    // Production factor: 4.5 kgCO2/ton
    const totalKg =
      calcElectricity * 0.82 +
      calcFuel * 2.68 +
      calcTransport * 0.21 +
      calcProduction * 4.5;
    const totalTons = Number((totalKg / 1000).toFixed(2));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let targetIndId = industryId;

      if (user && !targetIndId) {
        const { data: ind } = await supabase
          .from("industries")
          .select("id, company_name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (ind) {
          targetIndId = ind.id;
          setIndustryId(ind.id);
        }
      }

      if (!targetIndId) {
        // Fallback for demo preview if no active auth session
        const { data: fallbackInd } = await supabase
          .from("industries")
          .select("id")
          .limit(1)
          .maybeSingle();
        targetIndId = fallbackInd?.id || null;
      }

      if (!targetIndId) {
        throw new Error("Unable to identify industry account. Please ensure your industry profile is registered.");
      }

      const nowIso = new Date().toISOString();

      // ALWAYS perform an INSERT. Never UPSERT.
      const { data: insertedData, error: insertError } = await supabase
        .from("industry_emissions")
        .insert([
          {
            industry_id: targetIndId,
            report_month: selectedMonth,
            report_year: parseInt(selectedYear),
            electricity: calcElectricity,
            fuel: calcFuel,
            transport: calcTransport,
            production_tons: calcProduction,
            total_emission: totalTons,
            submitted_at: nowIso,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Database insert error:", insertError);
        setCalcError(`Database error: ${insertError.message || "Failed to record emission calculation."}`);
        setCalcSuccess(false);
        return;
      }

      // Display success ONLY after successful database insertion
      setEmissions(totalTons);
      setLastSubmittedId(insertedData.id);
      setCalcSuccess(true);
      setEmissionRecord({
        company: companyInfo.name,
        month: selectedMonth,
        year: selectedYear,
        electricity: calcElectricity,
        fuel: calcFuel,
        transport: calcTransport,
      });

      // Refresh submissions history from database immediately
      await fetchSubmissions(targetIndId);
    } catch (err: any) {
      console.error("Error saving emission calculation:", err);
      setCalcError(err?.message || "Failed to save calculation to database.");
      setCalcSuccess(false);
    } finally {
      setCalculating(false);
    }
  };

  // Pie chart calculation data
  const calcElectricity = (parseFloat(electricity) || 0) * 0.82 / 1000;
  const calcFuelVal = (parseFloat(fuel) || 0) * 2.68 / 1000;
  const calcTransportVal = (parseFloat(transport) || 0) * 0.21 / 1000;
  const calcProdVal = (parseFloat(productionTons) || 0) * 4.5 / 1000;

  const breakdownData = [
    { name: "Electricity (Scope 2)", value: Number(calcElectricity.toFixed(2)), color: "#16A34A" },
    { name: "Fuel & Heating (Scope 1)", value: Number(calcFuelVal.toFixed(2)), color: "#14532D" },
    { name: "Logistics (Scope 3)", value: Number(calcTransportVal.toFixed(2)), color: "#84CC16" },
    { name: "Industrial Production", value: Number(calcProdVal.toFixed(2)), color: "#0F766E" },
  ];

  return (
    <PortalLayout
      portalRole="industry"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={
        activeTab === "dashboard"
          ? "Industry Carbon Dashboard"
          : activeTab === "calculator"
          ? "Corporate Carbon Accounting Calculator"
          : activeTab === "purchases"
          ? "Carbon Credit Portfolio & Orders"
          : activeTab === "reports"
          ? "ESG & Sustainability Reports"
          : activeTab === "profile"
          ? "Company Environmental Profile"
          : "Industry Portal Settings"
      }
      subtitle={
        activeTab === "dashboard"
          ? "Real-time institutional GHG tracking, verified offset portfolio, and ESG compliance analytics."
          : activeTab === "calculator"
          ? "ISO 14064 & GHG Protocol compliant carbon footprint calculation for Scope 1, 2, and 3 emissions."
          : activeTab === "purchases"
          ? "Track retired carbon offsets, verified serial certificates, and direct payments to farmers."
          : activeTab === "reports"
          ? "Audit-ready ESG disclosure reports, SEBI BRSR and GHG Protocol exportable documents."
          : "Manage your legal entity, GST verification, and net-zero sustainability milestones."
      }
      actions={
        <div className="flex items-center gap-2.5">
          {activeTab !== "calculator" && (
            <button
              onClick={() => setActiveTab("calculator")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] hover:bg-[#F8FAF7] shadow-2xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Log Emissions</span>
            </button>
          )}
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#84CC16]" />
            <span>Buy Credits</span>
          </Link>
        </div>
      }
    >
      {/* ===================== TAB 1: DASHBOARD ===================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1 */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Total Emissions (YTD)
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#14532D] flex items-center justify-center">
                  <Factory className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  846.5
                </span>
                <span className="text-xs font-semibold text-[#64748B]">tCO₂e</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <TrendingDown className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>-8.4% vs previous quarter</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Credits Purchased
                </span>
                <div className="w-9 h-9 rounded-lg bg-lime-50 text-[#16A34A] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  325.0
                </span>
                <span className="text-xs font-semibold text-[#64748B]">tCO₂e</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Verified by Verra / GS</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Remaining Emissions
                </span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  521.5
                </span>
                <span className="text-xs font-semibold text-[#64748B]">tCO₂e</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-[#64748B]">
                <span>Offset Target: 75%</span>
                <span className="font-semibold text-[#14532D]">38.4% achieved</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-[#14532D] text-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#84CC16]">
                    Net-Zero 2035 Target
                  </span>
                  <Leaf className="w-4 h-4 text-[#84CC16]" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-extrabold tracking-tight">
                    38.4%
                  </span>
                  <p className="text-xs text-white/80 mt-1 font-medium">Reduction roadmap on track</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#84CC16] h-full rounded-full" style={{ width: "38.4%" }} />
              </div>
            </div>
          </div>

          {/* Charts Row: Monthly Emission Trends & Emissions vs Offsets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Emissions vs Offsets Area Chart */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">
                    Emissions vs. Carbon Offsets (tCO₂e)
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Monthly industrial carbon emissions compared with retired carbon credits.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#14532D]" /> Emissions
                  </span>
                  <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#16A34A]" /> Offsets
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={emissionTrendsData}>
                    <defs>
                      <linearGradient id="emissionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14532D" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#14532D" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="offsetsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" t" />
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
                      dataKey="emissions"
                      stroke="#14532D"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#emissionsGrad)"
                      name="Emissions"
                    />
                    <Area
                      type="monotone"
                      dataKey="offsets"
                      stroke="#16A34A"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#offsetsGrad)"
                      name="Offsets Retired"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scope 1, 2, 3 Breakdown Pie */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Emissions by Scope</h3>
                <p className="text-xs text-[#64748B] mb-4">
                  Standard GHG Protocol corporate categorization.
                </p>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {breakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                {breakdownData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#64748B]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate max-w-[150px]">{item.name}</span>
                    </span>
                    <span className="font-bold text-[#1F2937]">{item.value} tCO₂e</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Activities Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quick Actions Card */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
              <h3 className="text-base font-bold text-[#1F2937] mb-1">Quick Actions</h3>
              <p className="text-xs text-[#64748B] mb-4">Essential workflows for sustainability officers.</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab("calculator")}
                  className="p-3.5 rounded-lg border border-[#E5E7EB] hover:border-[#16A34A] hover:bg-emerald-50/30 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-md bg-emerald-50 text-[#14532D] flex items-center justify-center mb-2.5 group-hover:bg-[#14532D] group-hover:text-white transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-[#1F2937]">Log Emissions</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Calculate monthly footprint</p>
                </button>

                <Link
                  to="/marketplace"
                  className="p-3.5 rounded-lg border border-[#E5E7EB] hover:border-[#16A34A] hover:bg-emerald-50/30 text-left transition-all group block"
                >
                  <div className="w-8 h-8 rounded-md bg-lime-50 text-[#16A34A] flex items-center justify-center mb-2.5 group-hover:bg-[#16A34A] group-hover:text-white transition-colors">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-[#1F2937]">Marketplace</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Procure verified credits</p>
                </Link>

                <button
                  onClick={() => setActiveTab("reports")}
                  className="p-3.5 rounded-lg border border-[#E5E7EB] hover:border-[#16A34A] hover:bg-emerald-50/30 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center mb-2.5 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-[#1F2937]">ESG Reports</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Export BRSR summary</p>
                </button>

                <Link
                  to="/industry/profile"
                  className="p-3.5 rounded-lg border border-[#E5E7EB] hover:border-[#16A34A] hover:bg-emerald-50/30 text-left transition-all group block"
                >
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center mb-2.5 group-hover:bg-[#14532D] group-hover:text-white transition-colors">
                    <Factory className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-[#1F2937]">Profile & Goals</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Update entity details</p>
                </Link>
              </div>
            </div>

            {/* Recent Activities List */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">Recent Sustainability Logs</h3>
                  <p className="text-xs text-[#64748B]">Audited transactions and monthly emission entries.</p>
                </div>
                <button
                  onClick={() => setActiveTab("purchases")}
                  className="text-xs font-semibold text-[#16A34A] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-[#E5E7EB]">
                <div className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">
                        Retired 150 Credits &bull; Agroforestry Initiative
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Serial Certificate CX-CERT-2026-00481 issued
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#64748B]">Apr 12, 2026</span>
                </div>

                <div className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">
                        Logged March 2026 Emissions (110.0 tCO₂e)
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Scope 1 & 2 energy audit complete
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#64748B]">Apr 01, 2026</span>
                </div>

                <div className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-lime-50 text-lime-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">
                        Procured 175 Credits &bull; Gujarat Solar Microgrid
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Funds distributed to 14 participating farmers
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#64748B]">Mar 24, 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Geographic Offset Portfolio Map */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">
                  Verified Offset Sourcing Portfolio
                </h3>
                <p className="text-xs text-[#64748B]">
                  Geographic distribution of Indian smallholder agroforestry & solar projects backed by your company.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                {portfolioLocations.length} Active Farmer Projects
              </span>
            </div>

            <div className="h-80 w-full rounded-xl overflow-hidden border border-[#E5E7EB] relative">
              <MapContainer
                center={[22.5, 78.5]}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapResizer />
                {portfolioLocations.map((loc) => (
                  <Marker key={loc.id} position={loc.coords}>
                    <Popup>
                      <div className="p-2 text-xs">
                        <p className="font-bold text-[#14532D] text-sm">{loc.name}</p>
                        <p className="text-[#64748B] mt-0.5">{loc.location}</p>
                        <p className="mt-1.5 font-semibold text-[#1F2937]">
                          Sequestration: <span className="text-[#16A34A]">{loc.credits} CC</span>
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: EMISSION CALCULATOR & HISTORY ===================== */}
      {activeTab === "calculator" && (
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Main Calculator Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs">
            <div className="flex items-center gap-3 pb-6 border-b border-[#E5E7EB] mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#14532D] text-white flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#84CC16]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Carbon Accounting Calculator</h2>
                <p className="text-xs text-[#64748B]">
                  Input monthly operational resource consumption. Every submission creates an independent, permanent audit record with a unique UUID.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {calcError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-900">Submission Failed</p>
                  <p className="mt-0.5 text-red-700">{calcError}</p>
                </div>
              </div>
            )}

            {/* Success Message with UUID */}
            {calcSuccess && emissions !== null && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="font-bold text-[#14532D]">
                      Calculation successful: {emissions} tCO₂e recorded as a new submission!
                    </p>
                    {lastSubmittedId && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-emerald-200 font-mono text-[11px] text-emerald-900 font-semibold shadow-2xs">
                        ID: {lastSubmittedId.slice(0, 8)}...
                        <button
                          type="button"
                          onClick={() => handleCopyId(lastSubmittedId)}
                          className="text-[#16A34A] hover:text-[#14532D] ml-1 transition-colors"
                          title="Copy Full UUID"
                        >
                          {copiedSubmissionId === lastSubmittedId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-800 mt-1">
                    Logged for <strong>{selectedMonth} {selectedYear}</strong> under entity: {companyInfo.name}.
                    Prior submissions for this period are preserved and never overwritten.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleCalculate} className="space-y-6">
              {/* Period selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    Reporting Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    Reporting Year
                  </label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  />
                </div>
              </div>

              {/* Input parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#16A34A]" />
                    <label className="text-xs font-bold text-[#1F2937]">Electricity Consumption</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={electricity}
                      onChange={(e) => setElectricity(e.target.value)}
                      placeholder="e.g. 15000"
                      className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1F2937] font-semibold focus:ring-2 focus:ring-[#16A34A]/30"
                    />
                    <span className="text-xs font-bold text-[#64748B]">kWh</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1.5">Factor: 0.82 kg CO₂e / kWh</p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="w-4 h-4 text-[#14532D]" />
                    <label className="text-xs font-bold text-[#1F2937]">Fuel / Diesel Consumption</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={fuel}
                      onChange={(e) => setFuel(e.target.value)}
                      placeholder="e.g. 500"
                      className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1F2937] font-semibold focus:ring-2 focus:ring-[#16A34A]/30"
                    />
                    <span className="text-xs font-bold text-[#64748B]">Litres</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1.5">Factor: 2.68 kg CO₂e / L</p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-[#84CC16]" />
                    <label className="text-xs font-bold text-[#1F2937]">Transportation & Logistics</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      placeholder="e.g. 2000"
                      className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1F2937] font-semibold focus:ring-2 focus:ring-[#16A34A]/30"
                    />
                    <span className="text-xs font-bold text-[#64748B]">km</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1.5">Factor: 0.21 kg CO₂e / km</p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-2">
                    <Factory className="w-4 h-4 text-[#0F766E]" />
                    <label className="text-xs font-bold text-[#1F2937]">Production Volume</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={productionTons}
                      onChange={(e) => setProductionTons(e.target.value)}
                      placeholder="e.g. 300"
                      className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#1F2937] font-semibold focus:ring-2 focus:ring-[#16A34A]/30"
                    />
                    <span className="text-xs font-bold text-[#64748B]">Tons</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1.5">Factor: 4.5 kg CO₂e / Ton</p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                <div className="text-xs text-[#64748B]">
                  {emissions !== null && (
                    <span>
                      Estimated Total: <strong className="text-[#14532D] font-display text-base">{emissions} tCO₂e</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={calculating}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {calculating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating New Submission...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#84CC16]" />
                        <span>Save Calculation to Database</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Official Monthly Emission Summary Banner */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#14532D] flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">
                    Official Monthly Emission Summary ({selectedMonth} {selectedYear})
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Distinguishes official monthly corporate disclosures from raw historical submission records.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                  Latest Approved Benchmark
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB]">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Official Monthly Emissions
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-display text-[#14532D]">
                    {currentPeriodOfficial.official ? `${Number(currentPeriodOfficial.official.total_emission).toFixed(2)}` : "No Data"}
                  </span>
                  <span className="text-xs font-bold text-[#64748B]">tCO₂e</span>
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">
                  {currentPeriodOfficial.official
                    ? `Derived from the latest submission for ${selectedMonth} ${selectedYear}`
                    : `Submit resource usage above to record official footprint`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB]">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Submissions on File
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-display text-[#1F2937]">
                    {currentPeriodOfficial.totalSubmissions}
                  </span>
                  <span className="text-xs font-bold text-[#64748B]">
                    {currentPeriodOfficial.totalSubmissions === 1 ? "version" : "versions"}
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">
                  {currentPeriodOfficial.historicalRevisionsCount > 0
                    ? `${currentPeriodOfficial.historicalRevisionsCount} prior revisions archived; not summed together`
                    : "Initial baseline on record"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB]">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Active Submission Reference
                </span>
                {currentPeriodOfficial.official ? (
                  <div>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#14532D]">
                      <span>{currentPeriodOfficial.official.id.slice(0, 13)}...</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(currentPeriodOfficial.official!.id)}
                        className="p-1 hover:bg-white rounded text-[#64748B] hover:text-[#14532D] transition-colors"
                        title="Copy Full UUID"
                      >
                        {copiedSubmissionId === currentPeriodOfficial.official.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-1">
                      Submitted: {formatDateTime(currentPeriodOfficial.official.submitted_at || currentPeriodOfficial.official.created_at)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] mt-1 italic">No submission logged yet</p>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-start gap-2 text-xs text-emerald-900">
              <Info className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
              <p>
                <strong>Multiple Submission Architecture:</strong> Every submission is recorded as an independent database entry with a unique UUID. Revisions for the same reporting period do not overwrite prior records and are <em>never added together</em>. The latest verified submission serves as the official monthly emission benchmark for compliance reporting and carbon credit retirement.
              </p>
            </div>
          </div>

          {/* Emission Submission History Table */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#1F2937]">Emission Submission History & Audit Log</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F5F0] text-[#14532D] border border-[#E5E7EB]">
                    {submissions.length} Total Records
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Permanent immutable registry of all corporate resource submissions and Scope 1-3 calculations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Month Filter */}
                <div className="flex items-center gap-1.5 bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-[#64748B]" />
                  <select
                    value={historyFilterMonth}
                    onChange={(e) => setHistoryFilterMonth(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-[#1F2937] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Months</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-1.5 bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                  <select
                    value={historyFilterYear}
                    onChange={(e) => setHistoryFilterYear(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-[#1F2937] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order Toggle */}
                <button
                  type="button"
                  onClick={() => setHistorySortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8FAF7] text-xs font-semibold text-[#1F2937] transition-colors"
                  title="Toggle sort direction"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{historySortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => fetchSubmissions()}
                  disabled={loadingHistory}
                  className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAF7] text-[#64748B] hover:text-[#14532D] transition-colors"
                  title="Refresh History"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAF7] border-b border-[#E5E7EB] text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Submission ID</th>
                    <th className="px-5 py-3.5">Submitted At</th>
                    <th className="px-5 py-3.5">Reporting Period</th>
                    <th className="px-5 py-3.5">Electricity</th>
                    <th className="px-5 py-3.5">Fuel / Oil</th>
                    <th className="px-5 py-3.5">Logistics</th>
                    <th className="px-5 py-3.5">Production</th>
                    <th className="px-5 py-3.5">Total Emissions</th>
                    <th className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-[#64748B]">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                          <History className="w-8 h-8 text-[#CBD5E1] mb-2" />
                          <p className="font-semibold text-sm text-[#1F2937]">No Submissions Found</p>
                          <p className="text-xs text-[#64748B] mt-1">
                            {historyFilterMonth !== "all" || historyFilterYear !== "all"
                              ? "No records match the selected month/year filter."
                              : "No emission calculations have been recorded yet."}
                          </p>
                          {(historyFilterMonth !== "all" || historyFilterYear !== "all") && (
                            <button
                              type="button"
                              onClick={() => {
                                setHistoryFilterMonth("all");
                                setHistoryFilterYear("all");
                              }}
                              className="mt-3 px-3 py-1 text-xs font-semibold text-[#16A34A] hover:underline cursor-pointer"
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <tr
                        key={sub.id}
                        className={`hover:bg-emerald-50/20 transition-colors ${
                          sub.id === lastSubmittedId ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        {/* Submission UUID */}
                        <td className="px-5 py-3.5 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#1F2937]" title={sub.id}>
                              {sub.id.slice(0, 8)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(sub.id)}
                              className="p-1 hover:bg-[#F1F5F0] rounded text-[#64748B] hover:text-[#14532D] transition-colors"
                              title="Copy full UUID"
                            >
                              {copiedSubmissionId === sub.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Submitted At */}
                        <td className="px-5 py-3.5 text-[#64748B] whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="w-3 h-3 text-[#94A3B8]" />
                            {formatDateTime(sub.submitted_at || sub.created_at)}
                          </span>
                        </td>

                        {/* Period */}
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-[#1F2937]">
                            {sub.report_month} {sub.report_year}
                          </span>
                        </td>

                        {/* Electricity */}
                        <td className="px-5 py-3.5 text-[#1F2937] font-medium">
                          {Number(sub.electricity).toLocaleString()} <span className="text-[10px] text-[#64748B]">kWh</span>
                        </td>

                        {/* Fuel */}
                        <td className="px-5 py-3.5 text-[#1F2937] font-medium">
                          {Number(sub.fuel).toLocaleString()} <span className="text-[10px] text-[#64748B]">L</span>
                        </td>

                        {/* Transport */}
                        <td className="px-5 py-3.5 text-[#1F2937] font-medium">
                          {Number(sub.transport).toLocaleString()} <span className="text-[10px] text-[#64748B]">km</span>
                        </td>

                        {/* Production */}
                        <td className="px-5 py-3.5 text-[#1F2937] font-medium">
                          {Number(sub.production_tons || 0).toLocaleString()} <span className="text-[10px] text-[#64748B]">Tons</span>
                        </td>

                        {/* Total Emissions */}
                        <td className="px-5 py-3.5 font-bold text-[#14532D]">
                          {Number(sub.total_emission).toFixed(2)} <span className="text-[10px] font-normal text-[#64748B]">tCO₂e</span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {sub.isOfficialLatest ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                              Official Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                              <Clock className="w-3 h-3 text-[#94A3B8]" />
                              Historical Revision
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: MY PURCHASES ===================== */}
      {activeTab === "purchases" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Retired Carbon Credit Orders</h3>
                <p className="text-xs text-[#64748B]">
                  Official certificates of carbon retirement registered on the public registry.
                </p>
              </div>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-semibold shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Explore More Credits</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAF7] border-b border-[#E5E7EB] text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Order ID</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Project Sourced</th>
                    <th className="px-6 py-3.5">Volume</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#1F2937] font-mono">{p.id}</td>
                      <td className="px-6 py-4 text-[#64748B]">{p.date}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#1F2937] block">{p.project}</span>
                        <span className="text-[10px] text-[#64748B]">{p.farmer}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#14532D]">{p.quantity} CC (tCO₂e)</td>
                      <td className="px-6 py-4 font-bold text-[#1F2937]">${p.totalCost.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/confirmation?orderId=${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#F8FAF7] border border-[#E5E7EB] text-xs font-semibold text-[#14532D] hover:bg-emerald-50 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: REPORTS ===================== */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#14532D] flex items-center justify-center mb-4">
                  <FileBarChart2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#1F2937]">Annual GHG Emissions Report</h4>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Consolidated Scope 1, 2, and 3 GHG disclosures aligned with ISO 14064-1 standard.
                </p>
              </div>
              <button
                onClick={() => alert("Downloading comprehensive GHG Inventory Report (PDF)...")}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download GHG Report (PDF)
              </button>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-lime-50 text-[#16A34A] flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#1F2937]">Carbon Offset Ledger</h4>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Registry-verified serial numbers, certificate of retirement, and project validation reports.
                </p>
              </div>
              <button
                onClick={() => alert("Downloading Verified Offset Ledger (CSV)...")}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#F8FAF7] text-[#1F2937] text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#14532D]" /> Export Ledger (CSV)
              </button>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#1F2937]">SEBI BRSR Compliance Export</h4>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Business Responsibility and Sustainability Reporting Principle 6 (Environment) disclosures.
                </p>
              </div>
              <button
                onClick={() => alert("Generating SEBI BRSR Format (XLSX)...")}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#F8FAF7] text-[#1F2937] text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#14532D]" /> Generate BRSR Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: PROFILE SHORTCUT ===================== */}
      {activeTab === "profile" && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-lg font-bold text-[#1F2937]">{companyInfo.name}</h3>
              <p className="text-xs text-[#64748B]">{companyInfo.type}</p>
            </div>
            <Link
              to="/industry/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#14532D] text-white rounded-lg text-xs font-semibold hover:bg-[#166534] transition-colors"
            >
              <span>Edit Full Profile</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#F8FAF7] rounded-lg">
              <span className="text-[#64748B] font-bold block mb-1">GST Number</span>
              <span className="text-[#1F2937] font-semibold">{companyInfo.gst}</span>
            </div>
            <div className="p-4 bg-[#F8FAF7] rounded-lg">
              <span className="text-[#64748B] font-bold block mb-1">CIN / Registration No.</span>
              <span className="text-[#1F2937] font-semibold">{companyInfo.regNo}</span>
            </div>
            <div className="p-4 bg-[#F8FAF7] rounded-lg">
              <span className="text-[#64748B] font-bold block mb-1">Contact Officer</span>
              <span className="text-[#1F2937] font-semibold">{companyInfo.contactPerson} ({companyInfo.email})</span>
            </div>
            <div className="p-4 bg-[#F8FAF7] rounded-lg">
              <span className="text-[#64748B] font-bold block mb-1">Registered Address</span>
              <span className="text-[#1F2937] font-semibold">{companyInfo.city}</span>
            </div>
            <div className="p-4 bg-[#F8FAF7] rounded-lg">
              <span className="text-[#64748B] font-bold block mb-1">Renewable Energy Mix</span>
              <span className="text-[#16A34A] font-bold">{companyInfo.renewablePct}</span>
            </div>
            <div className="p-4 bg-[#F8FAF7] rounded-lg">
              <span className="text-[#64748B] font-bold block mb-1">Target Net-Zero Year</span>
              <span className="text-[#14532D] font-bold">{companyInfo.netZeroTarget}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 6: SETTINGS ===================== */}
      {activeTab === "settings" && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs space-y-6">
          <h3 className="text-lg font-bold text-[#1F2937] pb-4 border-b border-[#E5E7EB]">
            Industry Portal Preferences
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 bg-[#F8FAF7] rounded-lg">
              <div>
                <p className="font-bold text-[#1F2937]">Automated Monthly Emission Reminders</p>
                <p className="text-[#64748B] text-[11px]">Notify designated energy auditors on the 1st of every month.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#16A34A]" />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F8FAF7] rounded-lg">
              <div>
                <p className="font-bold text-[#1F2937]">Public Registry Verification Badge</p>
                <p className="text-[#64748B] text-[11px]">Allow investors and stakeholders to verify retirement certificates via QR code.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#16A34A]" />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F8FAF7] rounded-lg">
              <div>
                <p className="font-bold text-[#1F2937]">API Access for ERP / SAP Integration</p>
                <p className="text-[#64748B] text-[11px]">Sync corporate utility meter readings directly to CarbonX.</p>
              </div>
              <button className="px-3 py-1.5 rounded bg-white border border-[#E5E7EB] font-bold text-[#14532D] hover:bg-slate-50">
                Generate API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
