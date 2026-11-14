import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FileDown,
  LayoutDashboard,
  CheckCircle2,
  Trees,
  ShieldCheck,
  Car,
  Calendar,
  Building,
  User,
  Printer,
  Sparkles,
  ExternalLink,
  Award
} from "lucide-react";

export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const razorpayId: string = state.razorpayPaymentId || `rzp_test_${Date.now().toString().slice(-6)}`;
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = razorpayId ? razorpayId.slice(-6).toUpperCase() : "00150";
  const displayOrderId = `CX-${yyyymmdd}-${shortId}`;
  const displayCertId = `CX-CERT-2026-${shortId}`;

  const quantity = state.quantity || 150;
  const pricePerTon = state.pricePerTon || 22.0;
  const platformFee = state.platformFee || quantity * pricePerTon * 0.05;
  const totalCost = state.totalCost || quantity * pricePerTon + platformFee;
  const treesEquivalent = state.treesEquivalent || Math.round(quantity * 45.6);
  const carsOffRoad = state.carsOffRoad || (quantity * 0.2133).toFixed(1);
  const buyerName = state.buyerName || "Tata Steel Green Initiatives Ltd.";
  const projectName = state.projectName || "Western Ghats Agroforestry Bio-Carbon Project";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] font-sans antialiased pb-24">
      {/* Success Top Banner */}
      <div className="bg-[#14532D] text-white py-4 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#84CC16] text-[#14532D] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs uppercase tracking-wider">
                Payment Authorized & Carbon Credits Retired
              </p>
              <p className="text-[11px] text-white/80">
                Registered on the CarbonX Public Climate Registry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-10 space-y-8">
        {/* Certificate Card (Printable Layout) */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200/80 p-8 sm:p-12 shadow-md relative overflow-hidden">
          {/* Certificate Header Watermark Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          {/* Official Seal / Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-[#E5E7EB] gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#14532D] text-white flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6 text-[#84CC16]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#16A34A] block">
                  Official Verification Document
                </span>
                <h1 className="text-xl sm:text-2xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  Certificate of Carbon Retirement
                </h1>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Certificate Serial Number
              </span>
              <span className="font-mono font-bold text-xs text-[#14532D] bg-[#F8FAF7] px-3 py-1 rounded border border-[#E5E7EB] inline-block mt-1">
                {displayCertId}
              </span>
            </div>
          </div>

          {/* Core Certificate Attestation */}
          <div className="py-8 text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
              This certifies that
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#14532D]">
              {buyerName}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed font-medium">
              has permanently retired <strong className="text-[#1F2937]">{quantity.toLocaleString()} Metric Tons (tCO₂e)</strong> of verified carbon credits generated by smallholder farmers in India.
            </p>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB] text-xs">
            <div>
              <span className="text-[#64748B] block text-[10px] font-bold uppercase">Order Reference</span>
              <span className="font-bold text-[#1F2937] font-mono">{displayOrderId}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] font-bold uppercase">Date of Settlement</span>
              <span className="font-bold text-[#1F2937]">{formattedDate}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] font-bold uppercase">Source Project</span>
              <span className="font-bold text-[#1F2937] truncate block">{projectName}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] font-bold uppercase">Gateway Payment ID</span>
              <span className="font-bold text-[#16A34A] font-mono truncate block">{razorpayId}</span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mt-8 border border-[#E5E7EB] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF7] text-[10px] font-bold uppercase text-[#64748B] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Rate</th>
                  <th className="px-6 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr>
                  <td className="px-6 py-3.5 font-semibold text-[#1F2937]">
                    Verified Carbon Credits ({quantity} tCO₂e)
                  </td>
                  <td className="px-6 py-3.5 text-[#64748B]">${pricePerTon.toFixed(2)} / ton</td>
                  <td className="px-6 py-3.5 text-right font-bold text-[#1F2937]">
                    ${(quantity * pricePerTon).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-semibold text-[#1F2937]">
                    CarbonX Registry & Governance Fee (5%)
                  </td>
                  <td className="px-6 py-3.5 text-[#64748B]">Platform Clearing</td>
                  <td className="px-6 py-3.5 text-right font-bold text-[#1F2937]">
                    ${platformFee.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-[#F8FAF7] font-bold">
                  <td colSpan={2} className="px-6 py-3.5 text-sm text-[#1F2937]">
                    Total Paid
                  </td>
                  <td className="px-6 py-3.5 text-right text-base text-[#14532D]">
                    ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Impact Equivalency Row */}
          <div className="mt-8 p-5 bg-emerald-50 rounded-xl border border-emerald-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#14532D] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#16A34A]" />
              <span>Environmental Equivalency Impact</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Trees className="w-8 h-8 text-[#16A34A] flex-shrink-0" />
                <div>
                  <span className="font-extrabold text-base text-[#14532D] block">
                    {treesEquivalent.toLocaleString()} Trees Preserved
                  </span>
                  <span className="text-[11px] text-[#64748B]">Supporting rural Indian farmer agroforestry.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Car className="w-8 h-8 text-[#16A34A] flex-shrink-0" />
                <div>
                  <span className="font-extrabold text-base text-[#14532D] block">
                    {carsOffRoad} Passenger Cars
                  </span>
                  <span className="text-[11px] text-[#64748B]">Emissions eliminated for a full year.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Compliance Attestation */}
          <div className="mt-10 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Immutable cryptographic hash registered on CarbonX registry.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-[#14532D]">Verified by CarbonX Authority</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Link
            to="/marketplace"
            className="px-5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1F2937] hover:bg-[#F8FAF7] transition-colors"
          >
            &larr; Back to Marketplace
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#14532D] hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <FileDown className="w-4 h-4 text-[#16A34A]" />
              <span>Download Official PDF Certificate</span>
            </button>
            <Link
              to="/industry"
              className="px-6 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold transition-colors shadow-xs"
            >
              Go to Industry Dashboard &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
