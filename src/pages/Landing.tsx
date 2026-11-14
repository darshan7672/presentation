import React from "react";
import { Link } from "react-router-dom";
import {
  Trees,
  Factory,
  ArrowRight,
  ShieldCheck,
  Globe,
  Zap,
  Leaf,
  Satellite,
  BadgeCheck,
  FileText,
  DollarSign,
  Compass,
  CheckCircle2,
  Lock,
  Sparkles,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

const tickerData = [
  { pair: "VCS-INDIA (Agroforestry)", price: "$24.00", change: "+3.2%" },
  { pair: "GS-SOLAR (Microgrids)", price: "$22.50", change: "+1.8%" },
  { pair: "BIOCHAR-SOIL (Regen)", price: "$38.00", change: "+2.1%" },
  { pair: "MANGROVE-BLUE (Coastal)", price: "$34.00", change: "+4.5%" },
  { pair: "NEEM-BIOMASS (North India)", price: "$20.50", change: "+0.8%" },
];

const stats = [
  { label: "Verified Credits Issued", value: "48,250+", sub: "tCO₂e permanently retired" },
  { label: "Smallholder Farmers", value: "1,248", sub: "satellite-monitored parcels" },
  { label: "Corporate Partners", value: "342", sub: "active ESG net-zero buyers" },
  { label: "Direct Farmer Payouts", value: "95%", sub: "guaranteed direct revenue share" },
];

const steps = [
  {
    icon: Satellite,
    title: "1. Measure & Map",
    desc: "Smallholder farmers geotag farm parcels. Optical satellite imagery and AI tree-canopy detection verify biomass growth.",
  },
  {
    icon: BadgeCheck,
    title: "2. Independent MRV Audit",
    desc: "Third-party validation verifies ISO 14064-2 compliance, issuing unique serialized credits onto the CarbonX Registry.",
  },
  {
    icon: FileText,
    title: "3. Trade, Retire & Reward",
    desc: "Industrial corporations procure and retire credits for ESG compliance. 95% of proceeds transfer directly to farmer bank accounts.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1F2937] font-sans antialiased overflow-x-hidden">
      {/* Top Live Ticker Band */}
      <div className="bg-[#14532D] text-white py-2 px-4 text-xs overflow-hidden border-b border-emerald-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#84CC16]">Live Carbon Registry Index:</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-[11px] font-semibold text-white/90">
            {tickerData.map((t) => (
              <span key={t.pair} className="inline-flex items-center gap-1.5">
                <span className="text-white/70">{t.pair}:</span>
                <span className="font-bold">{t.price}</span>
                <span className="text-[#84CC16] text-[10px]">{t.change}</span>
              </span>
            ))}
          </div>
          <div className="text-[11px] text-white/80 font-semibold">
            ISO 14064 & Verra Compliant
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-[#F8FAF7] to-white border-b border-[#E5E7EB]">
        {/* Subtle background graphics */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-lime-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Empowering Industries. Rewarding Farmers. Restoring the Planet.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold text-[#1F2937] tracking-tight leading-[1.08] max-w-4xl mx-auto">
              Institutional Carbon Management & <span className="text-[#14532D]">High-Integrity Marketplace.</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto font-medium leading-relaxed">
              CarbonX bridges industrial leaders striving for Net Zero with thousands of smallholder farmers planting trees across India. Fully transparent, satellite-verified, and financially rewarding.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                to="/marketplace"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Carbon Marketplace</span>
                <ArrowRight className="w-4 h-4 text-[#84CC16]" />
              </Link>
              <Link
                to="/login?role=farmer&mode=register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#F8FAF7] text-[#1F2937] text-xs font-bold uppercase tracking-wider shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                <Trees className="w-4 h-4 text-[#16A34A]" />
                <span>Register as Farmer</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Stats Band */}
      <section className="relative z-20 -mt-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          {stats.map((s) => (
            <div key={s.label} className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                {s.label}
              </span>
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-[#14532D] tracking-tight mt-1 block">
                {s.value}
              </span>
              <span className="text-[11px] text-[#64748B] font-medium block mt-0.5">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Three Distinct User Experiences Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">
            Purpose-Built Portals
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#1F2937] tracking-tight">
            Tailored Experiences for Every Stakeholder
          </h2>
          <p className="text-sm text-[#64748B] font-medium">
            Seamlessly integrating heavy corporations, smallholder rural cultivators, and climate audit administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Industry Portal */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#14532D] flex items-center justify-center group-hover:bg-[#14532D] group-hover:text-white transition-colors">
                <Factory className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#1F2937]">Industry Portal</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Corporate greenhouse gas accounting across Scope 1, 2, and 3. Procure and retire verified carbon credits, download SEBI BRSR reports, and monitor progress toward Net-Zero goals.
              </p>
              <ul className="space-y-1.5 text-xs text-[#1F2937] font-semibold pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Automated Carbon Accounting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Certificate of Retirement Ledger
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> BRSR & ISO 14064 Compliance
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#E5E7EB]">
              <Link
                to="/industry"
                className="w-full py-2.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Industry Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Farmer Portal */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-lime-50 text-[#16A34A] flex items-center justify-center group-hover:bg-[#16A34A] group-hover:text-white transition-colors">
                <Trees className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#1F2937]">Farmer Portal</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Simple, accessible interface designed for farmers. Geotag land parcels, log tree growth, calculate carbon sequestration, access agroforestry training, and receive direct bank payouts.
              </p>
              <ul className="space-y-1.5 text-xs text-[#1F2937] font-semibold pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> 3-Step Simple Land Registration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Direct Benefit Bank Wallet
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Free Capacity Training Modules
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#E5E7EB]">
              <Link
                to="/farmer"
                className="w-full py-2.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Farmer Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Admin Console */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-[#1F2937]">Admin Console</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Enterprise operations console. Verify farmer submissions with Sentinel satellite telemetry, manage credit tranches, audit transactions, and oversee platform financial clearing.
              </p>
              <ul className="space-y-1.5 text-xs text-[#1F2937] font-semibold pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> AI Satellite MRV Workbench
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Marketplace Supply & Price Control
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Escrow Clearing & Audit Logs
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-[#E5E7EB]">
              <Link
                to="/admin"
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (From Field to Retirement) */}
      <section className="py-20 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">
              Scientific Verification Flow
            </span>
            <h2 className="text-3xl font-display font-extrabold text-[#1F2937] tracking-tight">
              From Indian Farmland to Verifiable Carbon Retirement
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.title} className="p-6 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB] space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#14532D] text-white flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#84CC16]" />
                  </div>
                  <h3 className="text-base font-bold text-[#1F2937]">{st.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#14532D] flex items-center justify-center text-white">
              <Leaf className="w-4 h-4 text-[#84CC16]" />
            </div>
            <div>
              <span className="font-display font-extrabold text-base text-[#14532D]">
                Carbon<span className="text-[#16A34A]">X</span>
              </span>
              <p className="text-[11px] text-[#64748B]">Empowering Industries. Rewarding Farmers. Restoring the Planet.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-semibold text-[#1F2937]">
            <Link to="/marketplace" className="hover:text-[#14532D]">Marketplace</Link>
            <Link to="/industry" className="hover:text-[#14532D]">Industry Portal</Link>
            <Link to="/farmer" className="hover:text-[#14532D]">Farmer Portal</Link>
            <Link to="/admin" className="hover:text-[#14532D]">Admin Console</Link>
          </div>

          <div className="text-right text-[11px] text-[#64748B]">
            &copy; {new Date().getFullYear()} CarbonX Inc. ISO 14064-2 & Verra VCS Standards.
          </div>
        </div>
      </footer>
    </div>
  );
}
