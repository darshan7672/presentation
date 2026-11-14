import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ShoppingCart,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  CreditCard,
  LineChart,
  Settings,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Download,
  AlertTriangle,
  MapPin,
  Trees,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  Satellite,
  RefreshCw
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
  ResponsiveContainer,
  Legend
} from "recharts";
import { mockProjects } from "../data/projects";
import PortalLayout from "../components/PortalLayout";
import { Link, useSearchParams } from "react-router-dom";
import FarmMonitor from "./FarmMonitor";

// Mock Industries for Admin Management
const mockIndustries = [
  {
    id: 1,
    name: "Tata Steel Green Initiatives Ltd.",
    type: "Manufacturing & Metals",
    contactPerson: "Dr. Arvind Mehta",
    email: "arvind.mehta@tatagreen.com",
    location: "Mumbai, Maharashtra",
    totalEmissions: "846.5 tCO₂e",
    creditsPurchased: "325 CC",
    regDate: "2026-01-15",
    status: "Active / Verified",
  },
  {
    id: 2,
    name: "Adani Clean Energy & Utilities",
    type: "Energy & Utilities",
    contactPerson: "Sunita Deshmukh",
    email: "s.deshmukh@adanienergy.com",
    location: "Ahmedabad, Gujarat",
    totalEmissions: "1,240.0 tCO₂e",
    creditsPurchased: "650 CC",
    regDate: "2026-02-10",
    status: "Active / Verified",
  },
  {
    id: 3,
    name: "UltraTech Sustainable Cement Corp",
    type: "Cement & Infrastructure",
    contactPerson: "Rajeev Singhania",
    email: "r.singhania@ultratech.com",
    location: "Jaipur, Rajasthan",
    totalEmissions: "950.0 tCO₂e",
    creditsPurchased: "410 CC",
    regDate: "2026-03-01",
    status: "Active / Verified",
  },
  {
    id: 4,
    name: "Mahindra Mobility & EV Systems",
    type: "Automotive",
    contactPerson: "Kavita Rao",
    email: "kavita.rao@mahindra.com",
    location: "Pune, Maharashtra",
    totalEmissions: "520.0 tCO₂e",
    creditsPurchased: "200 CC",
    regDate: "2026-03-18",
    status: "Pending Compliance Review",
  },
];

// Mock Transactions / Payments
const mockPayments = [
  {
    id: "PAY-2026-091",
    industry: "Tata Steel Green Initiatives",
    farmer: "Rameshwar Patil (Sabarkantha)",
    project: "Western Ghats Agroforestry",
    amount: 3465.0,
    platformFee: 173.25,
    farmerPayable: 3291.75,
    status: "Settled / Paid",
    date: "2026-04-12",
  },
  {
    id: "PAY-2026-088",
    industry: "Adani Clean Energy",
    farmer: "Gujarat Solar Microgrid Co-Op",
    project: "Gujarat Solar Microgrid Co-Op",
    amount: 3400.0,
    platformFee: 170.0,
    farmerPayable: 3230.0,
    status: "Settled / Paid",
    date: "2026-03-24",
  },
  {
    id: "PAY-2026-074",
    industry: "UltraTech Sustainable Cement",
    farmer: "Singh Farms (Punjab)",
    project: "Punjab Agroforestry Initiative",
    amount: 5500.0,
    platformFee: 275.0,
    farmerPayable: 5225.0,
    status: "Settled / Paid",
    date: "2026-03-15",
  },
];

// Analytics Data
const monthlyPlatformData = [
  { month: "Jan", revenue: 8400, creditsTraded: 420, farmers: 110 },
  { month: "Feb", revenue: 12600, creditsTraded: 630, farmers: 145 },
  { month: "Mar", revenue: 19800, creditsTraded: 990, farmers: 195 },
  { month: "Apr", revenue: 27500, creditsTraded: 1375, farmers: 260 },
  { month: "May", revenue: 34200, creditsTraded: 1710, farmers: 340 },
  { month: "Jun", revenue: 42800, creditsTraded: 2140, farmers: 430 },
];

export default function AdminPanel() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [monitorFarmId, setMonitorFarmId] = useState<string>("");

  const [farmers, setFarmers] = useState<any[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [hasSupabaseSession, setHasSupabaseSession] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarmerModal, setSelectedFarmerModal] = useState<any | null>(null);
  const [selectedIndustryModal, setSelectedIndustryModal] = useState<any | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  const [industries, setIndustries] = useState<any[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [industrySearchTerm, setIndustrySearchTerm] = useState("");

  const [marketplaceProjects, setMarketplaceProjects] = useState<any[]>(mockProjects);

  useEffect(() => {
    fetchFarmers();
    fetchIndustries();
  }, []);

  const fetchFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSupabaseSession(Boolean(session?.user));

      let localCache: Record<string, any> = {};
      try {
        localCache = JSON.parse(localStorage.getItem("carbonx_farm_boundaries") || "{}");
      } catch {
        localCache = {};
      }

      const { data, error } = await supabase.from("farms").select("*").order("id", { ascending: false });
      if (!error && data) {
        const seenIds = new Set(data.map((f: any) => String(f.id)));
        const enriched = data.map((f: any) => {
          const cached = localCache[String(f.id)];
          const displayName =
            f.name ||
            f.farm_name ||
            cached?.farmer_name ||
            cached?.farm_name ||
            (f.species ? `${String(f.species).charAt(0).toUpperCase() + String(f.species).slice(1)} Farm #${f.id}` : `Farmer #${f.id}`);
          return {
            ...f,
            name: displayName,
            farmer_name: f.farmer_name || cached?.farmer_name || null,
            village: f.village || cached?.village || null,
            district: f.district || cached?.district || null,
            state: f.state || cached?.state || null,
            farm_boundary: f.farm_boundary || cached?.farm_boundary || null,
            area_acres: f.area_acres || cached?.area_acres || f.area,
            area_sqm: f.area_sqm || cached?.area_sqm || null,
          };
        });

        // Also include any locally registered farms (e.g. if Supabase RLS blocked insert)
        Object.entries(localCache).forEach(([key, cached]: [string, any]) => {
          if (!seenIds.has(key) && cached && (cached.area_acres || cached.farm_boundary || cached.farmer_name)) {
            enriched.unshift({
              id: cached.farm_id || Number(key) || key,
              name: cached.farmer_name || cached.farm_name || `Farmer #${key}`,
              farmer_name: cached.farmer_name || null,
              farm_name: cached.farm_name || null,
              village: cached.village || null,
              district: cached.district || null,
              state: cached.state || null,
              area: cached.area_acres || 0,
              area_acres: cached.area_acres || 0,
              area_sqm: cached.area_sqm || null,
              farm_boundary: cached.farm_boundary || null,
              trees: cached.trees || 0,
              carbon: cached.carbon || 0,
              practice: cached.practice || "Agroforestry",
              species: cached.species || "Mixed",
              latitude: cached.latitude || 20.5937,
              longitude: cached.longitude || 78.9629,
              status: cached.status || "pending",
              created_at: cached.created_at || new Date().toISOString(),
              isLocalOnly: true,
            });
          }
        });

        setFarmers(enriched);
      } else {
        // Fallback sample records if DB empty
        setFarmers([
          {
            id: 1,
            name: "Singh Agro Farms",
            area: 50,
            trees: 1800,
            species: "Teak & Neem",
            carbon: 125,
            practice: "Agroforestry",
            status: "pending",
            latitude: 30.901,
            longitude: 75.8573,
            created_at: "2026-04-20",
          },
          {
            id: 2,
            name: "Patel Solar & Soil Park",
            area: 120,
            trees: 850,
            species: "Solar Farm",
            carbon: 310,
            practice: "Solar Farm",
            status: "approved",
            latitude: 23.0225,
            longitude: 72.5714,
            created_at: "2026-04-18",
          },
          {
            id: 3,
            name: "Western Ghats Ecological Co-Op",
            area: 40,
            trees: 1200,
            species: "Mahogany & Mango",
            carbon: 95,
            practice: "Agroforestry",
            status: "pending",
            latitude: 15.3173,
            longitude: 75.7139,
            created_at: "2026-04-25",
          },
        ]);
      }
    } catch (e) {
      console.warn("Could not fetch farmers:", e);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const approveFarmer = async (id: number) => {
    const farmer = farmers.find((f) => f.id === id);
    if (!farmer) return;

    try {
      await supabase.from("farms").update({ status: "approved" }).eq("id", id);
    } catch (e) {
      console.warn("Supabase update error:", e);
    }

    setFarmers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "approved" } : f))
    );

    // Add to marketplace listing
    const newListing = {
      id: Date.now(),
      name: farmer.name || `Farmer #${farmer.id} Project`,
      location: farmer.latitude ? `${farmer.latitude.toFixed(2)}, ${farmer.longitude.toFixed(2)}` : "India",
      type: farmer.practice || "Agroforestry",
      available: `${farmer.carbon || 50} CC`,
      pricePerCredit: 25.0,
      description: `Verified ${farmer.practice || "carbon"} project.`,
      farmer: farmer.name || `Farmer #${farmer.id}`,
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
      coords: [farmer.latitude || 20.5937, farmer.longitude || 78.9629] as [number, number],
      verified: "Verra VCS Verified",
    };
    setMarketplaceProjects((prev) => [newListing, ...prev]);

    setSelectedFarmerModal(null);
    alert(`Farm project #${id} approved! Issued carbon credits are now listed on the CarbonX Marketplace.`);
  };

  const rejectFarmer = async (id: number) => {
    try {
      await supabase.from("farms").update({ status: "rejected" }).eq("id", id);
    } catch (e) {
      console.warn("Supabase reject error:", e);
    }

    setFarmers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "rejected" } : f))
    );
    setSelectedFarmerModal(null);
  };

  const fetchIndustries = async () => {
    setLoadingIndustries(true);
    try {
      const { data, error } = await supabase
        .from("industries")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // Query emission records to compute real logged emissions for each industry
        let emissionsByIndustry = new Map<string, number>();
        try {
          const { data: emData } = await supabase
            .from("industry_emissions")
            .select("industry_id, total_emission");
          if (emData) {
            emData.forEach((e: any) => {
              const val = parseFloat(e.total_emission) || 0;
              emissionsByIndustry.set(e.industry_id, (emissionsByIndustry.get(e.industry_id) || 0) + val);
            });
          }
        } catch (emErr) {
          console.warn("Could not load emissions aggregate:", emErr);
        }

        const formatted = data.map((ind: any) => {
          const computedEm = emissionsByIndustry.get(ind.id) ?? parseFloat(ind.annual_emissions) ?? 0;
          return {
            id: ind.id,
            name: ind.company_name || `Enterprise #${ind.id.slice(0, 8)}`,
            type: ind.industry_type || "Manufacturing & Operations",
            contactPerson: ind.contact_person || "Corporate Officer",
            email: ind.email || "N/A",
            phone: ind.phone || "N/A",
            location: ind.city && ind.state ? `${ind.city}, ${ind.state}` : (ind.city || ind.state || "India"),
            gst: ind.gst_number || "N/A",
            totalEmissions: `${computedEm > 0 ? computedEm.toFixed(2) : "0.00"} tCO₂e`,
            creditsPurchased: `${ind.credits_required || 0} CC`,
            regDate: ind.created_at ? new Date(ind.created_at).toISOString().split("T")[0] : "2026-04-01",
            status: "Active / Verified",
            raw: ind,
          };
        });

        setIndustries(formatted);
      } else {
        setIndustries(mockIndustries);
      }
    } catch (e) {
      console.warn("Could not fetch industries:", e);
      setIndustries(mockIndustries);
    } finally {
      setLoadingIndustries(false);
    }
  };

  // Filtered industries
  const filteredIndustries = industries.filter((ind) => {
    if (!industrySearchTerm) return true;
    const term = industrySearchTerm.toLowerCase();
    return (
      (ind.name || "").toLowerCase().includes(term) ||
      (ind.type || "").toLowerCase().includes(term) ||
      (ind.contactPerson || "").toLowerCase().includes(term) ||
      (ind.email || "").toLowerCase().includes(term) ||
      (ind.location || "").toLowerCase().includes(term) ||
      (ind.gst || "").toLowerCase().includes(term)
    );
  });

  // Filtered farmers
  const filteredFarmers = farmers.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      String(f.id).includes(term) ||
      (f.name && f.name.toLowerCase().includes(term)) ||
      (f.practice && f.practice.toLowerCase().includes(term)) ||
      (f.species && f.species.toLowerCase().includes(term))
    );
  });

  const pendingVerificationList = farmers.filter((f) => f.status === "pending" || !f.status);

  return (
    <PortalLayout
      portalRole="admin"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={
        activeTab === "overview"
          ? "Platform Operations & Executive Overview"
          : activeTab === "farmers"
          ? "Farmer Landholdings & Onboarding Management"
          : activeTab === "industries"
          ? "Corporate Industry Accounts & ESG Audits"
          : activeTab === "verification"
          ? "MRV Satellite Project Verification Workbench"
          : activeTab === "monitor"
          ? "Live Satellite & AI MRV Monitoring Workbench"
          : activeTab === "marketplace"
          ? "Marketplace Credit Listings & Price Controls"
          : activeTab === "payments"
          ? "Financial Clearing, Escrow & Commissions"
          : activeTab === "analytics"
          ? "Macro Climate Impact & Platform Metrics"
          : "System Configuration & Governance"
      }
      subtitle={
        activeTab === "overview"
          ? "High-level liquidity, registered carbon inventory, and ecosystem participant growth."
          : activeTab === "farmers"
          ? "Review farmer submissions, biometric KYC, and approve verified land parcels."
          : activeTab === "industries"
          ? "Corporate sustainability officers, emission allowances, and retirement compliance."
          : activeTab === "verification"
          ? "Inspect satellite imagery, soil organic carbon (SOC) reports, and tree biomass."
          : activeTab === "monitor"
          ? "Interactive satellite boundary mapping, Sentinel-2 NDVI vegetative health, and YOLOv8 tree detection."
          : activeTab === "marketplace"
          ? "Control available supply, benchmark pricing per tCO₂e, and active listing statuses."
          : "Transparent fee ledger, 5% platform take-rate, and DBT payouts to farmers."
      }
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("monitor")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
              activeTab === "monitor"
                ? "bg-[#14532D] text-white"
                : "bg-white border border-[#E5E7EB] text-[#14532D] hover:bg-[#F8FAF7]"
            }`}
          >
            <Satellite className="w-4 h-4 text-[#16A34A]" />
            <span>Launch Satellite Farm Monitor</span>
          </button>
          <button
            onClick={() => alert("Exporting master compliance audit log (CSV)...")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#84CC16]" />
            <span>Export Audit Trail</span>
          </button>
        </div>
      }
    >
      {/* ===================== TAB 1: OVERVIEW ===================== */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Top 4 Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Total Farmers
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#14532D] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  {farmers.length}
                </span>
                <span className="text-xs font-bold text-[#16A34A]">Registered</span>
              </div>
              <p className="text-xs text-[#64748B] mt-2">
                {pendingVerificationList.length} pending verification
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Total Industries
                </span>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  {industries.length > 0 ? industries.length : 3}
                </span>
                <span className="text-xs font-bold text-blue-600">Registered</span>
              </div>
              <p className="text-xs text-[#64748B] mt-2">Heavy industry & tech corporates</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Credits Retired (tCO₂e)
                </span>
                <div className="w-9 h-9 rounded-lg bg-lime-50 text-[#16A34A] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-[#16A34A] tracking-tight">
                  48,250
                </span>
                <span className="text-xs font-semibold text-[#64748B]">CC</span>
              </div>
              <p className="text-xs text-[#16A34A] font-semibold mt-2">Verra & Gold Standard verified</p>
            </div>

            <div className="bg-[#14532D] text-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#84CC16]">
                    Platform GMV / Volume
                  </span>
                  <DollarSign className="w-4 h-4 text-[#84CC16]" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-extrabold tracking-tight">
                    $1.24M
                  </span>
                  <p className="text-xs text-white/80 mt-1">Platform Revenue: $62,000 (5%)</p>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-[#84CC16] font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+24.8% growth vs last quarter</span>
              </div>
            </div>
          </div>

          {/* Growth Chart & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">Platform GMV & Credits Traded</h3>
                  <p className="text-xs text-[#64748B]">Monthly marketplace liquidity growth.</p>
                </div>
                <span className="text-xs font-semibold text-[#14532D] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Fiscal 2026
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPlatformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Platform Revenue ($)" fill="#14532D" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="creditsTraded" name="Credits Traded (CC)" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pending Verification Priority Card */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#1F2937]">Action Required</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {pendingVerificationList.length} Pending
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mb-4">
                  Farms awaiting satellite boundary check and biometric verification approval.
                </p>

                <div className="space-y-2.5">
                  {pendingVerificationList.slice(0, 3).map((pf) => (
                    <div
                      key={pf.id}
                      className="p-3 rounded-lg bg-[#F8FAF7] border border-[#E5E7EB] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#1F2937]">{pf.name || `Farmer #${pf.id}`}</p>
                        <p className="text-[11px] text-[#64748B]">
                          {pf.area} Acres &bull; {pf.carbon || 50} CC
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFarmerModal(pf);
                          setActiveTab("verification");
                        }}
                        className="px-2.5 py-1 rounded bg-[#14532D] text-white text-[11px] font-bold hover:bg-[#166534]"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab("verification")}
                className="w-full mt-4 py-2 bg-[#F8FAF7] border border-[#E5E7EB] text-[#14532D] text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Go to Verification Workbench &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: FARMER MANAGEMENT ===================== */}
      {activeTab === "farmers" && (
        <div className="space-y-6">
          {!hasSupabaseSession && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Database session not synced:</strong> Only publicly approved farms are currently visible. Sign in again as Admin to view all newly registered &amp; pending farms.
                </span>
              </div>
              <Link
                to="/logout"
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 text-center"
              >
                Re-Sign In as Admin &rarr;
              </Link>
            </div>
          )}
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
            {/* Table Search & Controls */}
            <div className="p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search farmers by name, species, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#64748B]">
                  Showing <strong>{filteredFarmers.length}</strong> registered farmer records
                </span>
                <button
                  onClick={fetchFarmers}
                  disabled={loadingFarmers}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAF7] hover:bg-emerald-50 text-xs font-semibold text-[#14532D] transition-colors disabled:opacity-50"
                  title="Refresh registered farmers from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFarmers ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAF7] border-b border-[#E5E7EB] text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Farmer / Land</th>
                    <th className="px-6 py-3.5">Area</th>
                    <th className="px-6 py-3.5">Trees</th>
                    <th className="px-6 py-3.5">Practice</th>
                    <th className="px-6 py-3.5">Estimated Carbon</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredFarmers.map((f) => (
                    <tr key={f.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#1F2937] block">
                          {f.name || `Farmer #${f.id}`}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          ID: #{f.id} &bull; GPS:{" "}
                          {f.latitude ? `${f.latitude.toFixed(2)}, ${f.longitude.toFixed(2)}` : "Verified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1F2937]">
                        <div>{f.area_acres ? Number(f.area_acres).toFixed(2) : f.area} Acres</div>
                        {f.area_sqm ? (
                          <div className="text-[10px] text-[#64748B] font-normal">{Number(f.area_sqm).toLocaleString()} m²</div>
                        ) : null}
                        {f.farm_boundary && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Polygon Mapped
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1F2937]">{f.trees} Trees</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#F8FAF7] border border-[#E5E7EB] text-[10px] font-bold text-[#64748B]">
                          {f.practice || "Agroforestry"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#14532D]">
                        {f.carbon || 0} tCO₂e
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            f.status === "approved"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : f.status === "rejected"
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {f.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setMonitorFarmId(String(f.id));
                              setActiveTab("monitor");
                            }}
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-[#14532D] hover:bg-emerald-100"
                            title="View Farmer's Marked Polygon in Satellite Monitor"
                          >
                            <Satellite className="w-4 h-4 text-[#16A34A]" />
                          </button>
                          <button
                            onClick={() => setSelectedFarmerModal(f)}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#64748B] hover:text-[#14532D] hover:bg-[#F8FAF7]"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {f.status !== "approved" && (
                            <button
                              onClick={() => approveFarmer(f.id)}
                              className="px-2.5 py-1 rounded bg-[#16A34A] text-white text-[11px] font-bold hover:bg-[#15803D]"
                            >
                              Approve
                            </button>
                          )}
                          {f.status !== "rejected" && (
                            <button
                              onClick={() => rejectFarmer(f.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: INDUSTRY MANAGEMENT ===================== */}
      {activeTab === "industries" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#1F2937]">Registered Corporate Entities</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F5F0] text-[#14532D] border border-[#E5E7EB]">
                    {industries.length} Registered
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Verified industrial buyers and enterprises participating in carbon accounting & offset retirement.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by company, sector, GST..."
                    value={industrySearchTerm}
                    onChange={(e) => setIndustrySearchTerm(e.target.value)}
                    className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchIndustries()}
                  disabled={loadingIndustries}
                  className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAF7] text-[#64748B] hover:text-[#14532D] transition-colors cursor-pointer"
                  title="Refresh Industries"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingIndustries ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAF7] border-b border-[#E5E7EB] text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Company Legal Name</th>
                    <th className="px-6 py-3.5">Sector</th>
                    <th className="px-6 py-3.5">Contact Officer</th>
                    <th className="px-6 py-3.5">Total Emissions</th>
                    <th className="px-6 py-3.5">Credits Sourced</th>
                    <th className="px-6 py-3.5">Compliance Status</th>
                    <th className="px-6 py-3.5 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {loadingIndustries ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-[#16A34A] animate-spin mb-2" />
                          <p className="font-semibold text-xs text-[#1F2937]">Loading Registered Industries...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredIndustries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                        <div className="flex flex-col items-center justify-center">
                          <Building2 className="w-8 h-8 text-[#CBD5E1] mb-2" />
                          <p className="font-semibold text-xs text-[#1F2937]">No Corporate Entities Found</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            {industrySearchTerm
                              ? "No registered industries match the search term."
                              : "No industries currently registered in the database."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredIndustries.map((ind) => (
                      <tr key={ind.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#1F2937] block">{ind.name}</span>
                          <span className="text-[10px] text-[#64748B]">{ind.location}</span>
                        </td>
                        <td className="px-6 py-4 text-[#64748B]">{ind.type}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#1F2937] block">{ind.contactPerson}</span>
                          <span className="text-[10px] text-[#64748B]">{ind.email}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#1F2937]">{ind.totalEmissions}</td>
                        <td className="px-6 py-4 font-bold text-[#16A34A]">{ind.creditsPurchased}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-[#16A34A]" />
                            {ind.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedIndustryModal(ind)}
                            className="px-3 py-1 rounded bg-[#F8FAF7] border border-[#E5E7EB] font-bold text-[#14532D] hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            View
                          </button>
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

      {/* ===================== TAB 4: PROJECT VERIFICATION WORKBENCH ===================== */}
      {activeTab === "verification" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
            <h3 className="text-base font-bold text-[#1F2937]">Project MRV Verification Workbench</h3>
            <p className="text-xs text-[#64748B] mb-6">
              Review submitted farmer telemetry, GPS land polygon coordinates, and soil organic carbon lab records.
            </p>

            <div className="space-y-4">
              {pendingVerificationList.length === 0 ? (
                <div className="p-8 text-center bg-[#F8FAF7] rounded-xl border border-[#E5E7EB]">
                  <CheckCircle className="w-10 h-10 text-[#16A34A] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1F2937]">All projects verified!</p>
                  <p className="text-xs text-[#64748B] mt-1">There are no pending submissions requiring inspection.</p>
                </div>
              ) : (
                pendingVerificationList.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 rounded-xl border border-[#E5E7EB] bg-[#F8FAF7] flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#1F2937]">
                          {item.name || `Farmer #${item.id} Agroforestry Project`}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                          Awaiting MRV Audit
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-[#64748B] pt-1">
                        <div>
                          <span className="block text-[10px] font-bold uppercase">Farm Area</span>
                          <span className="font-semibold text-[#1F2937]">{item.area} Acres</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase">Trees Planted</span>
                          <span className="font-semibold text-[#1F2937]">{item.trees} Trees</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase">Est. Carbon</span>
                          <span className="font-bold text-[#14532D]">{item.carbon || 50} tCO₂e</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase">Practice</span>
                          <span className="font-semibold text-[#1F2937]">{item.practice || "Agroforestry"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMonitorFarmId(String(item.id));
                          setActiveTab("monitor");
                        }}
                        className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#14532D] hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Satellite className="w-4 h-4 text-[#16A34A]" />
                        <span>View Marked Polygon & Audit</span>
                      </button>
                      <button
                        onClick={() => approveFarmer(item.id)}
                        className="px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Approve & Mint Credits
                      </button>
                      <button
                        onClick={() => rejectFarmer(item.id)}
                        className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: SATELLITE MRV FARM MONITOR ===================== */}
      {activeTab === "monitor" && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
          <FarmMonitor initialFarmId={monitorFarmId} />
        </div>
      )}

      {/* ===================== TAB 5: MARKETPLACE CONTROL ===================== */}
      {activeTab === "marketplace" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Active Marketplace Listings</h3>
                <p className="text-xs text-[#64748B]">Manage listed credits, price per ton, and verification status.</p>
              </div>
              <Link
                to="/marketplace"
                className="px-3.5 py-1.5 bg-[#14532D] text-white rounded-lg text-xs font-semibold hover:bg-[#166534]"
              >
                View Public Marketplace &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAF7] border-b border-[#E5E7EB] text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Project Name</th>
                    <th className="px-6 py-3.5">Farmer / Co-Op</th>
                    <th className="px-6 py-3.5">Available Supply</th>
                    <th className="px-6 py-3.5">Price / CC</th>
                    <th className="px-6 py-3.5">Standard</th>
                    <th className="px-6 py-3.5 text-right">Listing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {marketplaceProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-emerald-50/20">
                      <td className="px-6 py-4 font-bold text-[#1F2937]">{proj.name}</td>
                      <td className="px-6 py-4 text-[#64748B]">{proj.farmer}</td>
                      <td className="px-6 py-4 font-bold text-[#14532D]">{proj.available}</td>
                      <td className="px-6 py-4 font-bold text-[#1F2937]">${proj.pricePerCredit.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          {proj.verified}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                          <Check className="w-3 h-3 text-[#16A34A]" /> Active Listing
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 6: PAYMENTS & COMMISSIONS ===================== */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Gross Volume Settled</span>
              <p className="text-3xl font-display font-extrabold text-[#1F2937] mt-2">$12,365.00</p>
              <p className="text-xs text-[#16A34A] font-semibold mt-1">100% Escrow Cleared</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Platform Commission (5%)</span>
              <p className="text-3xl font-display font-extrabold text-[#14532D] mt-2">$618.25</p>
              <p className="text-xs text-[#64748B] mt-1">Direct CarbonX Revenue</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Disbursed to Farmers (95%)</span>
              <p className="text-3xl font-display font-extrabold text-[#16A34A] mt-2">$11,746.75</p>
              <p className="text-xs text-[#64748B] mt-1">Direct Bank Transfers</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Recent Clearing & Settlement Ledger</h3>
                <p className="text-xs text-[#64748B]">Includes Razorpay gateway IDs and farmer bank credit logs.</p>
              </div>
              <button
                onClick={() => alert("Downloading Settlement Statement (CSV)...")}
                className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAF7] border-b border-[#E5E7EB] text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Payment ID</th>
                    <th className="px-6 py-3.5">Corporate Buyer</th>
                    <th className="px-6 py-3.5">Farmer Beneficiary</th>
                    <th className="px-6 py-3.5">Gross</th>
                    <th className="px-6 py-3.5">Fee (5%)</th>
                    <th className="px-6 py-3.5">Farmer Net</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {mockPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-emerald-50/20">
                      <td className="px-6 py-4 font-mono font-bold text-[#1F2937]">{pay.id}</td>
                      <td className="px-6 py-4 font-semibold text-[#1F2937]">{pay.industry}</td>
                      <td className="px-6 py-4 text-[#64748B]">{pay.farmer}</td>
                      <td className="px-6 py-4 font-bold text-[#1F2937]">${pay.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-[#14532D] font-bold">${pay.platformFee.toFixed(2)}</td>
                      <td className="px-6 py-4 text-[#16A34A] font-bold">${pay.farmerPayable.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 7: PLATFORM ANALYTICS ===================== */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
              <h4 className="text-sm font-bold text-[#1F2937] mb-2">Farmer Network Expansion</h4>
              <p className="text-xs text-[#64748B] mb-6">Cumulative smallholder farmers onboarded.</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyPlatformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="farmers" stroke="#14532D" fill="#14532D" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
              <h4 className="text-sm font-bold text-[#1F2937] mb-2">Cumulative CO₂ Sequestered & Retired</h4>
              <p className="text-xs text-[#64748B] mb-6">Net tons of greenhouse gas removed from atmosphere.</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyPlatformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="creditsTraded" stroke="#16A34A" fill="#16A34A" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 8: SETTINGS ===================== */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs space-y-6 text-xs">
          <h3 className="text-base font-bold text-[#1F2937] pb-4 border-b border-[#E5E7EB]">
            Admin Platform Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-[#1F2937] mb-1">Default Platform Commission Rate (%)</label>
              <input
                type="number"
                defaultValue={5}
                className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-bold text-[#14532D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1F2937] mb-1">Razorpay Key ID Status</label>
              <input
                type="text"
                readOnly
                value="rzp_test_active_verified"
                className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono text-[#64748B]"
              />
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px]">
              Platform running on Supabase PostgreSQL with Row Level Security (RLS) active.
            </div>
          </div>
        </div>
      )}

      {/* Full Details Modal for Farmers */}
      {selectedFarmerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#1F2937]">Farmer Farm Dossier</h3>
              <button
                onClick={() => setSelectedFarmerModal(null)}
                className="p-1 rounded-lg text-[#64748B] hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAF7] rounded-lg">
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Farmer Name</span>
                  <span className="font-bold text-[#1F2937]">{selectedFarmerModal.name || `Farmer #${selectedFarmerModal.id}`}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Land Size</span>
                  <span className="font-bold text-[#1F2937]">
                    {selectedFarmerModal.area_acres ? `${Number(selectedFarmerModal.area_acres).toFixed(2)} Acres` : `${selectedFarmerModal.area} Acres`}
                    {selectedFarmerModal.area_sqm ? (
                      <span className="block text-[11px] font-normal text-[#64748B]">
                        {Number(selectedFarmerModal.area_sqm).toLocaleString()} m² (Geodesic)
                      </span>
                    ) : null}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Trees</span>
                  <span className="font-bold text-[#1F2937]">{selectedFarmerModal.trees} Trees ({selectedFarmerModal.species || "Teak"})</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Carbon Generated</span>
                  <span className="font-bold text-[#14532D]">{selectedFarmerModal.carbon} tCO₂e</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Boundary Polygon</span>
                  <span className="font-bold text-[#1F2937]">
                    {selectedFarmerModal.farm_boundary ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        ✓ GeoJSON Polygon ({selectedFarmerModal.farm_boundary?.coordinates?.[0]?.length || 0} vertices)
                      </span>
                    ) : (
                      <span className="text-[#94A3B8] font-normal">Centroid point only</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">Cadastral Boundary Distinction:</span> Digital boundary polygons marked by farmers compute an estimation of area using Turf.js geodesics. For final carbon credit registry issuance, field-check validation or official cadastral land records are required.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F2937] mb-1">
                  Verification Notes / Field Audit Remarks
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="e.g. Satellite canopy density 82%, verified against cadastral survey records."
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg p-2.5 text-xs text-[#1F2937]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => {
                  const idToView = String(selectedFarmerModal.id);
                  setSelectedFarmerModal(null);
                  setMonitorFarmId(idToView);
                  setActiveTab("monitor");
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#14532D] hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Satellite className="w-4 h-4 text-[#16A34A]" />
                <span>View Marked Polygon in Monitor</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFarmerModal(null)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#1F2937]"
                >
                  Close
                </button>
                <button
                  onClick={() => approveFarmer(selectedFarmerModal.id)}
                  className="px-5 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold"
                >
                  Approve & Mint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Details Modal for Industry */}
      {selectedIndustryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#1F2937]">{selectedIndustryModal.name}</h3>
              <button
                onClick={() => setSelectedIndustryModal(null)}
                className="p-1 rounded-lg text-[#64748B] hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAF7] rounded-lg space-y-2">
                <p><strong>Sector:</strong> {selectedIndustryModal.type}</p>
                <p><strong>Contact Officer:</strong> {selectedIndustryModal.contactPerson}</p>
                <p><strong>Email:</strong> {selectedIndustryModal.email}</p>
                <p><strong>Phone:</strong> {selectedIndustryModal.phone || "N/A"}</p>
                <p><strong>GST Number:</strong> <span className="font-mono">{selectedIndustryModal.gst || "N/A"}</span></p>
                <p><strong>Location:</strong> {selectedIndustryModal.location}</p>
                <p><strong>Registration Date:</strong> {selectedIndustryModal.regDate}</p>
                <p><strong>Emissions Logged:</strong> <span className="font-bold text-[#14532D]">{selectedIndustryModal.totalEmissions}</span></p>
                <p><strong>Carbon Offsets Sourced:</strong> <span className="font-bold text-[#16A34A]">{selectedIndustryModal.creditsPurchased}</span></p>
                {selectedIndustryModal.id && typeof selectedIndustryModal.id === "string" && (
                  <p className="text-[10px] text-[#64748B] pt-1 border-t border-[#E5E7EB]">
                    <strong>Entity UUID:</strong> <span className="font-mono">{selectedIndustryModal.id}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => setSelectedIndustryModal(null)}
                className="px-4 py-2 rounded-lg bg-[#14532D] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
