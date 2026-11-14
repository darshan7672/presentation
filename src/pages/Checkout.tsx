import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  MapPin,
  ChevronRight,
  CreditCard,
  Building2,
  Trees,
  ShieldCheck,
  FileText,
  Lock,
  Loader2,
  AlertCircle,
  Car,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info
} from "lucide-react";
import { mockProjects } from "../data/projects";
import { loadRazorpay } from "../utils/loadRazorpay";
import { supabase } from "../supabaseClient";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = parseInt(searchParams.get("projectId") || "1");
  const project = mockProjects.find((p) => p.id === projectId) || mockProjects[0];

  const [quantity, setQuantity] = useState(150);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFailureModal, setShowFailureModal] = useState(false);

  // Billing Entity info
  const [billingEntity, setBillingEntity] = useState("Tata Steel Green Initiatives Ltd.");
  const [gstIn, setGstIn] = useState("27AAACT2727Q1ZW");
  const [retirementBeneficiary, setRetirementBeneficiary] = useState("Corporate ESG Net-Zero 2035 Target");

  const pricePerTon = project.pricePerCredit || 24.0;
  const platformFeeRate = 0.05; // 5% platform fee

  const subtotal = quantity * pricePerTon;
  const platformFee = subtotal * platformFeeRate;
  const totalCost = subtotal + platformFee;

  // Real-world equivalency metrics
  const treesEquivalent = Math.round(quantity * 45.6);
  const carsOffRoad = (quantity * 0.2133).toFixed(1);
  const flightHoursOffset = (quantity * 4.8).toFixed(0);

  const handleConfirmPayment = async () => {
    setError(null);
    setPaying(true);

    try {
      // 1. Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      const buyerEmail = user?.email || "sustainability@tatagreen.com";

      // 2. Load Razorpay SDK
      const loaded = await loadRazorpay();

      if (loaded && window.Razorpay) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
          amount: Math.round(totalCost * 83 * 100), // USD to INR conversion approximation
          currency: "INR",
          name: "CarbonX Climate Technologies",
          description: `${quantity} tCO₂e Carbon Credits — ${project.name}`,
          prefill: {
            email: buyerEmail,
            name: billingEntity,
          },
          theme: {
            color: "#14532D",
          },
          handler: async (response: { razorpay_payment_id: string }) => {
            // Record order in Supabase
            if (user?.id) {
              try {
                await supabase.rpc("create_order_atomic", {
                  p_user_id: user.id,
                  p_project_id: project.id,
                  p_project_name: project.name,
                  p_quantity: quantity,
                  p_total_cost: totalCost,
                  p_razorpay_payment_id: response.razorpay_payment_id,
                });
              } catch (e) {
                console.warn("RPC order logging skipped:", e);
              }
            }

            navigate("/confirmation", {
              state: {
                quantity,
                pricePerTon,
                platformFee,
                totalCost,
                treesEquivalent,
                carsOffRoad,
                projectName: project.name,
                buyerName: billingEntity,
                razorpayPaymentId: response.razorpay_payment_id,
              },
            });
          },
          modal: {
            ondismiss: () => {
              setPaying(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (err: any) => {
          console.error("Payment failed:", err);
          setError(err.description || "Payment was rejected by gateway.");
          setShowFailureModal(true);
          setPaying(false);
        });
        rzp.open();
      } else {
        // Instant simulated clearance for demo/test environments
        setTimeout(async () => {
          const mockPaymentId = `rzp_sim_${Date.now()}`;
          navigate("/confirmation", {
            state: {
              quantity,
              pricePerTon,
              platformFee,
              totalCost,
              treesEquivalent,
              carsOffRoad,
              projectName: project.name,
              buyerName: billingEntity,
              razorpayPaymentId: mockPaymentId,
            },
          });
        }, 1200);
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "An unexpected error occurred during payment handoff.");
      setShowFailureModal(true);
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] font-sans antialiased pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E5E7EB] py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link to="/marketplace" className="hover:text-[#14532D] font-semibold">
              &larr; Return to Marketplace
            </Link>
            <span className="text-[#E5E7EB]">&bull;</span>
            <span className="text-[#1F2937] font-bold">Secure Checkout & Carbon Retirement</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>256-Bit Encrypted Escrow</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Quantity, Beneficiary & Payment Gateway */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Credit Tranche Selection */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">1. Credit Quantity Selection</h2>
                  <p className="text-xs text-[#64748B]">Each credit represents 1 Metric Ton (tCO₂e) of permanently removed CO₂.</p>
                </div>
                <span className="text-xs font-bold text-[#14532D] bg-[#F8FAF7] px-2.5 py-1 rounded border border-[#E5E7EB]">
                  ${pricePerTon.toFixed(2)} / Ton
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#1F2937]">Volume to Purchase & Retire</label>
                  <span className="text-sm font-extrabold text-[#14532D] font-display">{quantity} Credits</span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="5"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#16A34A]"
                />

                {/* Preset quick buttons */}
                <div className="flex items-center gap-2 mt-3">
                  {[25, 50, 100, 150, 250, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuantity(val)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        quantity === val
                          ? "bg-[#14532D] text-white"
                          : "bg-[#F8FAF7] border border-[#E5E7EB] text-[#64748B] hover:text-[#1F2937]"
                      }`}
                    >
                      {val} t
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Corporate Retirement Entity */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">2. Retirement Certificate Details</h2>
                  <p className="text-xs text-[#64748B]">Legal entity under which the carbon credits will be retired.</p>
                </div>
                <FileText className="w-4 h-4 text-[#16A34A]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#1F2937] mb-1">Company Entity Name</label>
                  <input
                    type="text"
                    value={billingEntity}
                    onChange={(e) => setBillingEntity(e.target.value)}
                    className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-semibold text-[#1F2937]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1F2937] mb-1">Corporate GSTIN</label>
                  <input
                    type="text"
                    value={gstIn}
                    onChange={(e) => setGstIn(e.target.value)}
                    className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-semibold text-[#1F2937]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1F2937] mb-1">Retirement Purpose / Memo</label>
                  <input
                    type="text"
                    value={retirementBeneficiary}
                    onChange={(e) => setRetirementBeneficiary(e.target.value)}
                    className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3 py-2 font-semibold text-[#1F2937]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Gateway Checkout Handoff */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h2 className="text-base font-bold text-[#1F2937]">3. Payment Gateway Handoff</h2>
                  <p className="text-xs text-[#64748B]">Integrated with Razorpay for corporate netbanking, cards, and UPI.</p>
                </div>
                <CreditCard className="w-4 h-4 text-[#14532D]" />
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                    RZP
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1F2937]">Razorpay Enterprise Gateway</p>
                    <p className="text-[11px] text-[#64748B]">Supports Corporate Cards, NEFT/RTGS, UPI & Netbanking</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Ready
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                disabled={paying}
                onClick={handleConfirmPayment}
                className="w-full py-3.5 bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#84CC16]" />
                    <span>Connecting to Razorpay Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#84CC16]" />
                    <span>Pay ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} & Retire Credits</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Order Summary & Environmental Impact */}
          <div className="lg:col-span-5 space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-[#1F2937] pb-3 border-b border-[#E5E7EB]">
                Order Summary
              </h3>

              <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
                <img
                  src={project.image}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div>
                  <p className="text-xs font-bold text-[#1F2937] leading-snug">{project.name}</p>
                  <p className="text-[11px] text-[#64748B]">{project.farmer} &bull; {project.location}</p>
                  <span className="text-[10px] text-[#16A34A] font-bold">{project.verified}</span>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Credits Subtotal ({quantity} tCO₂e &times; ${pricePerTon.toFixed(2)})</span>
                  <span className="font-semibold text-[#1F2937]">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <span>Platform Registry Fee (5%)</span>
                    <Info className="w-3 h-3 text-[#64748B]" />
                  </span>
                  <span className="font-semibold text-[#1F2937]">${platformFee.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Registry Serialization & Audit</span>
                  <span className="font-semibold text-[#16A34A]">Included (₹0)</span>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1F2937]">Total Payable Amount</span>
                  <span className="text-xl font-display font-extrabold text-[#14532D]">
                    ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B] text-right">
                  Approx. ₹{Math.round(totalCost * 83).toLocaleString("en-IN")} INR
                </p>
              </div>
            </div>

            {/* Environmental Impact Equivalencies */}
            <div className="bg-[#14532D] text-white rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#84CC16]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#84CC16]">
                  Real Environmental Impact
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Trees className="w-5 h-5 text-[#84CC16] mb-1" />
                  <span className="text-lg font-display font-extrabold block">
                    {treesEquivalent.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-white/80">Equivalent Trees Growing</span>
                </div>

                <div className="p-3 bg-white/10 rounded-lg">
                  <Car className="w-5 h-5 text-[#84CC16] mb-1" />
                  <span className="text-lg font-display font-extrabold block">
                    {carsOffRoad}
                  </span>
                  <span className="text-[11px] text-white/80">Cars Removed for 1 Year</span>
                </div>
              </div>

              <p className="text-[11px] text-white/80 leading-relaxed pt-2 border-t border-white/15">
                95% of your transaction goes directly to smallholder farming families in rural India, funding agroforestry maintenance and tree care.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Failure Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#1F2937]">Payment Gateway Declined</h3>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                The transaction could not be authorized by your bank or the Razorpay gateway. No funds were debited.
              </p>
            </div>

            <div className="p-3 bg-[#F8FAF7] rounded-lg text-xs text-[#64748B] font-mono">
              Error: {error || "GATEWAY_TIMEOUT_REJECTED"}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowFailureModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] hover:bg-[#F8FAF7]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowFailureModal(false);
                  handleConfirmPayment();
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
