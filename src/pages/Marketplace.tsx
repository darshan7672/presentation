import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Activity,
  Trees,
  SlidersHorizontal,
  X,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Leaf
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { mockProjects } from "../data/projects";
import { apiFetch } from "../utils/apiClient";

// Fix Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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

const CATEGORIES = [
  "All",
  "Agroforestry",
  "Solar Farm",
  "Soil Carbon",
  "Mangrove Restoration",
  "Biochar",
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "volume" | "impact">("impact");
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState(mockProjects);
  const [selectedProjectModal, setSelectedProjectModal] = useState<any | null>(null);

  useEffect(() => {
    const fetchApprovedFarms = async () => {
      try {
        const response: any = await apiFetch(`/api/marketplace/projects?page=${currentPage}&limit=20`);
        if (response && response.projects) {
          const approvedProjects = response.projects.map((farmer: any) => {
            const farmerName = `Farmer #${farmer.id}`;
            const farmerLocation =
              farmer.latitude && farmer.longitude
                ? `${farmer.latitude.toFixed(4)}, ${farmer.longitude.toFixed(4)}`
                : "Gujarat, India";

            return {
              id: farmer.id + 1000,
              name: `${farmerName} Agroforestry Project`,
              location: farmerLocation,
              type: farmer.practice || "Agroforestry",
              available: `${farmer.carbon || 50} CC`,
              pricePerCredit: 24.0,
              description: `Verified ${farmer.practice || "agroforestry"} carbon sequestration project by ${farmerName}. MRV satellite checked.`,
              farmer: farmerName,
              image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
              coords: [farmer.latitude || 20.5937, farmer.longitude || 78.9629] as [number, number],
              verified: "Gold Standard Verified",
            };
          });

          setProjects([...mockProjects, ...approvedProjects]);
        }
      } catch (err) {
        console.warn("Using baseline projects:", err);
      }
    };

    fetchApprovedFarms();
  }, [currentPage]);

  // Filtering & Sorting
  const filteredProjects = projects
    .filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.farmer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterType === "All" ||
        project.type?.toLowerCase().includes(filterType.toLowerCase()) ||
        (filterType === "Agroforestry" && project.type === "Forestry");

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.pricePerCredit - b.pricePerCredit;
      if (sortBy === "price-high") return b.pricePerCredit - a.pricePerCredit;
      if (sortBy === "volume") {
        const valA = parseFloat(a.available) || 0;
        const valB = parseFloat(b.available) || 0;
        return valB - valA;
      }
      return 0;
    });

  const handleBuy = (projectId: number) => {
    navigate(`/checkout?projectId=${projectId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] font-sans antialiased pb-20">
      {/* Marketplace Hero & Search Band */}
      <div className="bg-white border-b border-[#E5E7EB] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Audited Under ISO 14064-2 & Verra Standards</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1F2937] tracking-tight">
                Carbon Credit Marketplace
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-1.5 max-w-2xl">
                Explore high-integrity carbon credits generated by smallholder Indian farmers and verified agroforestry projects. Direct payments ensure financial rewards reach rural communities.
              </p>
            </div>

            {/* Total Market Liquidity Quick Pill */}
            <div className="flex items-center gap-4 bg-[#F8FAF7] border border-[#E5E7EB] px-4 py-3 rounded-xl flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Available Market Supply
                </span>
                <span className="text-xl font-display font-extrabold text-[#14532D]">
                  62,450 <span className="text-xs font-semibold text-[#64748B]">tCO₂e</span>
                </span>
              </div>
              <div className="h-8 w-px bg-[#E5E7EB]" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Average Price
                </span>
                <span className="text-xl font-display font-extrabold text-[#16A34A]">
                  $22.80 <span className="text-xs font-semibold text-[#64748B]">/ CC</span>
                </span>
              </div>
            </div>
          </div>

          {/* Search, Category Filter & Sorting Row */}
          <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search projects, farmer clusters, state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterType(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterType === cat
                      ? "bg-[#14532D] text-white shadow-xs"
                      : "bg-[#F8FAF7] border border-[#E5E7EB] text-[#64748B] hover:text-[#1F2937] hover:bg-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end lg:self-auto flex-shrink-0">
              <span className="text-xs text-[#64748B] font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
              >
                <option value="impact">Highest Carbon Impact</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="volume">Available Volume</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {/* Interactive Geographical Sourcing Map */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">Geographic Project Network</h2>
              <p className="text-xs text-[#64748B]">
                Click on any project pin to view location coordinates, tree density, and available credit tranches.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>{filteredProjects.length} Verified Listings Online</span>
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
              {filteredProjects.map((project) => (
                <Marker key={project.id} position={project.coords}>
                  <Popup>
                    <div className="p-2 min-w-[200px] text-xs font-sans">
                      <p className="font-bold text-[#14532D] text-sm">{project.name}</p>
                      <p className="text-[#64748B] mt-0.5">{project.location}</p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-[#1F2937]">${project.pricePerCredit}/t</span>
                        <button
                          onClick={() => handleBuy(project.id)}
                          className="px-3 py-1 rounded bg-[#14532D] text-white font-bold text-[10px] hover:bg-[#166534]"
                        >
                          Buy Credits
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#1F2937]">Available Carbon Projects</h2>
            <span className="text-xs text-[#64748B]">
              Showing {filteredProjects.length} projects
            </span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
              <Trees className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
              <p className="text-base font-bold text-[#1F2937]">No projects match your filter</p>
              <p className="text-xs text-[#64748B] mt-1">
                Try searching for a different keyword or selecting "All" categories.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("All");
                }}
                className="mt-4 px-4 py-2 bg-[#14532D] text-white text-xs font-semibold rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Project Image Banner */}
                    <div className="h-48 overflow-hidden relative bg-slate-100">
                      <img
                        src={project.image}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold text-[#14532D] uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                        <MapPin className="w-3 h-3 text-[#16A34A]" />
                        <span>{project.location}</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-[#14532D]/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider shadow-2xs">
                        {project.type || "Agroforestry"}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-[#1F2937] group-hover:text-[#16A34A] transition-colors leading-snug">
                          {project.name}
                        </h3>
                        <p className="text-[11px] text-[#64748B] font-medium mt-1">
                          Project Owner: <strong className="text-[#1F2937]">{project.farmer}</strong>
                        </p>
                      </div>

                      <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-[#16A34A]" />
                        <span>{project.verified || "Verra VCS Verified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Actions Footer */}
                  <div className="p-5 pt-0">
                    <div className="grid grid-cols-2 gap-2 p-3 bg-[#F8FAF7] rounded-lg border border-[#E5E7EB] mb-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Available Credits
                        </span>
                        <span className="font-extrabold text-[#14532D] text-sm">{project.available}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Price per Credit
                        </span>
                        <span className="font-extrabold text-[#16A34A] text-sm">
                          ${project.pricePerCredit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProjectModal(project)}
                        className="flex-1 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1F2937] hover:bg-[#F8FAF7] transition-colors"
                      >
                        Project Details
                      </button>
                      <button
                        onClick={() => handleBuy(project.id)}
                        className="flex-1 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <span>Purchase</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#1F2937]"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors ${
                currentPage === page
                  ? "bg-[#14532D] text-white shadow-xs"
                  : "bg-white border border-[#E5E7EB] text-[#64748B] hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#1F2937]"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project Details Modal / Drawer */}
      {selectedProjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-xl w-full p-6 shadow-xl animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">{selectedProjectModal.name}</h3>
                <p className="text-xs text-[#64748B]">{selectedProjectModal.location}</p>
              </div>
              <button
                onClick={() => setSelectedProjectModal(null)}
                className="p-1 rounded-lg text-[#64748B] hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-44 rounded-xl overflow-hidden">
              <img
                src={selectedProjectModal.image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#64748B] leading-relaxed">
                {selectedProjectModal.description}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAF7] rounded-lg">
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Farmer Co-Op</span>
                  <span className="font-bold text-[#1F2937]">{selectedProjectModal.farmer}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Certification Standard</span>
                  <span className="font-bold text-[#16A34A]">{selectedProjectModal.verified}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Available Credits</span>
                  <span className="font-bold text-[#14532D]">{selectedProjectModal.available}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] font-bold uppercase">Price per Ton</span>
                  <span className="font-bold text-[#1F2937]">${selectedProjectModal.pricePerCredit.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => setSelectedProjectModal(null)}
                className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#1F2937]"
              >
                Close
              </button>
              <button
                onClick={() => handleBuy(selectedProjectModal.id)}
                className="px-6 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
