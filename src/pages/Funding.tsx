import React, { useState, FormEvent } from "react";
import {
  DollarSign,
  Send,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Trees,
  Sprout,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import PortalLayout from "../components/PortalLayout";

export default function Funding() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [fullName, setFullName] = useState("Rameshwar Kisan");
  const [farmSize, setFarmSize] = useState("15");
  const [requestedAmount, setRequestedAmount] = useState("75000");
  const [purpose, setPurpose] = useState(
    "Procurement of 600 high-density teak and neem saplings, organic biochar preparation, and drip irrigation line installation."
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <PortalLayout
      portalRole="farmer"
      activeTab="wallet"
      title="Capital Grants & Pre-Financing Support"
      subtitle="Apply for upfront capital and equipment financing to transition into verified agroforestry without high upfront debt."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Information Callout */}
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-2xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center flex-shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#14532D]">0% Interest Transition Grants</h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              CarbonX climate partners and institutional CSR funds provide grant pre-financing. Funds are disbursed directly to accredited nurseries or equipment providers, and recouped naturally as your future carbon credits mature.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-10 text-center shadow-2xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#1F2937]">Funding Application Registered!</h2>
            <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
              Your grant application of <strong>₹{Number(requestedAmount).toLocaleString("en-IN")}</strong> has been received by our agricultural committee. An officer will visit your village within 3 business days for site confirmation.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setIsSuccess(false)}
                className="px-6 py-2.5 rounded-lg bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534]"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-2xs space-y-5">
            <h3 className="text-base font-bold text-[#1F2937] pb-3 border-b border-[#E5E7EB]">
              Grant Application Form
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#1F2937] mb-1">Applicant Name</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2937] mb-1">Farm Size (Acres)</label>
                <input
                  required
                  type="number"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[#1F2937] mb-1">
                  Requested Grant Capital (INR ₹)
                </label>
                <input
                  required
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                />
                <p className="text-[10px] text-[#64748B] mt-1">Recommended grant cap: ₹5,000 per acre</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[#1F2937] mb-1">
                  Operational Utilization Plan
                </label>
                <textarea
                  required
                  rows={4}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 font-semibold text-[#1F2937] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#84CC16]" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#84CC16]" />
                    <span>Submit Grant Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </PortalLayout>
  );
}
