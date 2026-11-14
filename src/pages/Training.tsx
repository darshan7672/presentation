import React, { useState } from "react";
import {
  BookOpen,
  PlayCircle,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Trees,
  Layers,
  Leaf,
  ChevronRight,
  Video,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";

const modules = [
  {
    id: 1,
    title: "Understanding Carbon Sequestration & Credits",
    category: "Carbon Basics",
    duration: "25 mins",
    lessons: 4,
    completed: true,
    progress: 100,
    desc: "Learn how trees absorb atmospheric carbon dioxide, how credits are calculated, and how you receive direct payments into your bank account.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2,
    title: "Agroforestry Best Practices & Species Selection",
    category: "Tree Management",
    duration: "45 mins",
    lessons: 6,
    completed: true,
    progress: 100,
    desc: "Best practices for intercropping teak, neem, mahogany, and fruit trees with food crops to maximize carbon yield and crop production.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 3,
    title: "Soil Organic Carbon (SOC) Improvement & Biochar",
    category: "Soil Science",
    duration: "35 mins",
    lessons: 5,
    completed: false,
    progress: 40,
    desc: "Techniques for zero-tillage, biochar application, and composting that store carbon underground and dramatically improve soil water retention.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 4,
    title: "High-Density Tree Plantation & Pruning Techniques",
    category: "Plantation",
    duration: "40 mins",
    lessons: 5,
    completed: false,
    progress: 0,
    desc: "Spacing guidance, root development, organic pest deterrents, and seasonal pruning to accelerate tree girth (GBH) expansion.",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 5,
    title: "Carbon Verification & Satellite MRV Readiness",
    category: "Certification",
    duration: "30 mins",
    lessons: 3,
    completed: false,
    progress: 0,
    desc: "Understand what satellite cameras and auditors look for during quarterly inspections so your carbon credits get approved without delay.",
    image: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&q=80&w=800",
  },
];

export default function Training() {
  const [selectedModule, setSelectedModule] = useState<any | null>(null);

  return (
    <PortalLayout
      portalRole="farmer"
      activeTab="training"
      title="Farmer Learning & Capacity Centre"
      subtitle="Easy-to-follow practical guides and training modules to maximize tree growth, soil health, and carbon earnings."
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#14532D] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#16A34A]" />
            <span>Certification Track: 2 of 5 Completed</span>
          </span>
        </div>
      }
    >
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Progress Bar Banner */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#1F2937]">Your Farmer Training Progress</h3>
            <p className="text-xs text-[#64748B]">Complete all 5 modules to receive Certified Carbon Farmer status.</p>
          </div>
          <div className="w-full sm:w-64 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#14532D]">48% Completed</span>
              <span className="text-[#64748B]">2 Modules Done</span>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
              <div className="bg-[#16A34A] h-full rounded-full" style={{ width: "48%" }} />
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={mod.image}
                    alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded text-[10px] font-bold text-[#14532D] uppercase tracking-wider">
                    {mod.category}
                  </div>
                  {mod.completed && (
                    <div className="absolute top-3 right-3 bg-[#16A34A] text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2.5">
                  <h4 className="text-base font-bold text-[#1F2937] group-hover:text-[#16A34A] transition-colors leading-snug">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-[#64748B] line-clamp-3 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-3 border-t border-[#E5E7EB]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {mod.duration}
                  </span>
                  <span>{mod.lessons} Lessons</span>
                </div>

                <button
                  onClick={() => setSelectedModule(mod)}
                  className="w-full py-2.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4 text-[#84CC16]" />
                  <span>{mod.completed ? "Review Module" : mod.progress > 0 ? "Resume Module" : "Start Learning"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video / Module Preview Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">
                  {selectedModule.category}
                </span>
                <h3 className="text-base font-bold text-[#1F2937] leading-snug">
                  {selectedModule.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                className="p-1 rounded-lg text-[#64748B] hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-48 rounded-xl overflow-hidden relative bg-slate-900 flex items-center justify-center">
              <img
                src={selectedModule.image}
                alt=""
                className="w-full h-full object-cover opacity-70"
              />
              <button
                onClick={() => alert("Video playback started in audio-video player.")}
                className="absolute w-14 h-14 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <PlayCircle className="w-8 h-8" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              {selectedModule.desc}
            </p>

            <div className="flex justify-end pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => setSelectedModule(null)}
                className="px-5 py-2 bg-[#14532D] text-white rounded-lg text-xs font-bold"
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
