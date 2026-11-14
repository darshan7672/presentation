import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Factory,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Activity,
  Save,
  ArrowRight,
  ShieldCheck,
  Globe,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Zap
} from "lucide-react";
import { supabase } from "../supabaseClient";
import PortalLayout from "../components/PortalLayout";

export default function IndustryProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  // Section 1: Company Information
  const [companyName, setCompanyName] = useState("");
  const [industryType, setIndustryType] = useState("Manufacturing");
  const [gstNumber, setGstNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [website, setWebsite] = useState("");

  // Section 2: Contact Information
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Section 3: Address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pinCode, setPinCode] = useState("");

  // Section 4: Operational & ESG Profile
  const [annualProduction, setAnnualProduction] = useState("50,000 MT");
  const [renewableEnergyPct, setRenewableEnergyPct] = useState("35%");
  const [esgCompliance, setEsgCompliance] = useState("ISO 14064 & GRI Compliant");
  const [netZeroTargetYear, setNetZeroTargetYear] = useState("2035");

  useEffect(() => {
    async function checkUserAndFetchProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          navigate("/login");
          return;
        }

        setUserId(user.id);
        setEmail(user.email || "");

        // Fetch existing profile if available
        const { data, error } = await supabase
          .from("industries")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setCompanyName(data.company_name || "");
          setIndustryType(data.industry_type || "Manufacturing");
          setGstNumber(data.gst_number || "");
          setRegistrationNumber(data.registration_number || "");
          setWebsite(data.website || "https://www.tatagreen.com");
          setContactPerson(data.contact_person || "");
          setEmail(data.email || user.email || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setState(data.state || "");
          setCountry(data.country || "India");
          setPinCode(data.pin_code || "");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setFetching(false);
      }
    }

    checkUserAndFetchProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!userId) {
      setErrorMessage("You must be logged in to save details.");
      setLoading(false);
      return;
    }

    if (!companyName || !gstNumber || !contactPerson) {
      setErrorMessage("Please complete the required company name, GST, and contact person fields.");
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, any> = {
        user_id: userId,
        company_name: companyName,
        industry_type: industryType,
        gst_number: gstNumber,
        registration_number: registrationNumber,
        contact_person: contactPerson,
        email: email,
        phone: phone,
        address: address,
        city: city,
        state: state,
        country: country,
        pin_code: pinCode,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("industries")
        .upsert([payload], { onConflict: "user_id" });

      if (error) throw error;

      setSuccessMessage("Company profile successfully updated and synchronized!");
      setTimeout(() => {
        navigate("/industry");
      }, 1200);
    } catch (err: any) {
      console.error("Error saving company profile:", err);
      setErrorMessage(err.message || "Failed to save profile. Please check database permissions.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#14532D] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            Loading Company Profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PortalLayout
      portalRole="industry"
      activeTab="profile"
      title="Company Profile & ESG Compliance"
      subtitle="Maintain verified institutional records, corporate tax IDs, and ESG net-zero commitment targets."
      actions={
        <Link
          to="/industry"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] hover:bg-[#F8FAF7] transition-colors"
        >
          <span>Back to Dashboard</span>
        </Link>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Verification Alert Banner */}
        <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#14532D]">Enterprise ESG Verification: Active</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Verified entities are qualified to retire carbon credits and receive official SEBI-compliant certificates.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Audit Level 2
          </span>
        </div>

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#14532D] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Company Information */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
              <Factory className="w-4 h-4 text-[#14532D]" />
              <h3 className="text-sm font-bold text-[#1F2937]">1. Company Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Tata Steel Green Initiatives Ltd."
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Industry Sector *</label>
                <select
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                >
                  <option value="Manufacturing">Heavy Manufacturing & Metals</option>
                  <option value="Energy & Utilities">Energy, Power & Utilities</option>
                  <option value="Cement & Construction">Cement & Infrastructure</option>
                  <option value="Chemicals & Fertilizers">Chemicals & Fertilizers</option>
                  <option value="Automotive & Transport">Automotive & Transport</option>
                  <option value="Textiles & Consumer">Textiles & FMCG</option>
                  <option value="Technology & Data Centers">Technology & Data Centers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">GST Number *</label>
                <input
                  type="text"
                  required
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="27AAACT2727Q1ZW"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">CIN / Registration Number</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="CIN-U27100MH2020PLC123456"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Corporate Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.yourcompany.com"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Person */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
              <User className="w-4 h-4 text-[#14532D]" />
              <h3 className="text-sm font-bold text-[#1F2937]">2. Sustainability Contact Officer</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Contact Officer Name *</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Dr. Arvind Mehta"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sustainability@company.com"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Direct Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Registered Address */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
              <MapPin className="w-4 h-4 text-[#14532D]" />
              <h3 className="text-sm font-bold text-[#1F2937]">3. Headquarters & Facility Address</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Facility Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 42, Green Industrial Corridor, Phase 2"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">PIN Code</label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="400001"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: ESG & Net-Zero Target */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
              <Sparkles className="w-4 h-4 text-[#84CC16]" />
              <h3 className="text-sm font-bold text-[#1F2937]">4. ESG Milestones & Target Framework</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Annual Production Volume</label>
                <input
                  type="text"
                  value={annualProduction}
                  onChange={(e) => setAnnualProduction(e.target.value)}
                  placeholder="e.g. 100,000 Metric Tons"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Renewable Energy Percentage</label>
                <input
                  type="text"
                  value={renewableEnergyPct}
                  onChange={(e) => setRenewableEnergyPct(e.target.value)}
                  placeholder="e.g. 40%"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">ESG Compliance Standard</label>
                <input
                  type="text"
                  value={esgCompliance}
                  onChange={(e) => setEsgCompliance(e.target.value)}
                  placeholder="e.g. ISO 14064-1 / GRI / SEBI BRSR"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">Net-Zero Target Year</label>
                <input
                  type="text"
                  value={netZeroTargetYear}
                  onChange={(e) => setNetZeroTargetYear(e.target.value)}
                  placeholder="e.g. 2035"
                  className="w-full bg-[#F8FAF7] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#1F2937] font-semibold focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to="/industry"
              className="px-5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1F2937] hover:bg-[#F8FAF7]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-[#84CC16]" />
              <span>{loading ? "Saving Changes..." : "Save Company Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
