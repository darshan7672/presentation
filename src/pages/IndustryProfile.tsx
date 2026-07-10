import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";

export default function IndustryProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form states divided by sections
  // Section 1: Company Information
  const [companyName, setCompanyName] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

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



  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkUserAndFetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        setUserId(user.id);
        setEmail(user.email || "");

        // Try to fetch existing industry profile to prepopulate
        const { data, error } = await supabase
          .from("industries")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("Could not fetch existing profile, might not exist yet:", error);
        }

        if (data) {
          setCompanyName(data.company_name || "");
          setIndustryType(data.industry_type || "");
          setGstNumber(data.gst_number || "");
          setRegistrationNumber(data.registration_number || "");
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
        console.error("Error loading user profile:", err);
      } finally {
        setFetching(false);
      }
    }

    checkUserAndFetchProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (!userId) {
      setErrorMessage("You must be logged in to save details.");
      setLoading(false);
      return;
    }

    // Basic Validations
    if (!companyName || !industryType || !gstNumber || !registrationNumber) {
      setErrorMessage("Please fill all Company Information fields.");
      setLoading(false);
      return;
    }

    if (!contactPerson || !email || !phone) {
      setErrorMessage("Please fill all Contact Information fields.");
      setLoading(false);
      return;
    }

    if (!address || !city || !state || !pinCode) {
      setErrorMessage("Please fill all Address fields.");
      setLoading(false);
      return;
    }



    try {
      const payload = {
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
        .upsert([payload], {
          onConflict: "user_id"
        });

      if (error) {
        throw error;
      }

      // Success and redirect
      navigate("/industry");
    } catch (err: any) {
      console.error("Error saving company profile:", err);
      setErrorMessage(err.message || "Failed to save company profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
          <p className="text-slate-500 font-bold text-sm tracking-wider uppercase">Loading Profile Info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50/50 p-4 sm:p-6 lg:p-12 font-sans relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-12">
        {/* Header */}
        <div className="max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-emerald-500/20"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Industrial Compliance Setup</span>
          </motion.div>
          <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter leading-none mb-4">
            Company <span className="text-gradient-emerald">Profile</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
            Configure your organization details, sustainability credentials, and regulatory numbers to register in the verified carbon ecosystem.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Company Information */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-8 sm:p-10 bg-white/95 backdrop-blur-sm border-none shadow-premium relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                <Factory className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Company Information</h3>
                <p className="text-xs text-slate-400 font-medium">Verify legal status and identity</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Company Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                    placeholder="e.g. Sterling Steel Industries"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Industry Type</label>
                <select
                  required
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold cursor-pointer"
                >
                  <option value="" disabled>Select Industry Type</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Energy & Utilities">Energy & Utilities</option>
                  <option value="Chemicals">Chemicals</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Logistics & Transport">Logistics & Transport</option>
                  <option value="Textiles">Textiles</option>
                  <option value="Technology">Technology</option>
                  <option value="Agriculture & Food">Agriculture & Food</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">GST Number</label>
                <input
                  type="text"
                  required
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300 uppercase"
                  placeholder="e.g. 27AAACS1085F1Z5"
                  maxLength={15}
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Registration Number</label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                  placeholder="e.g. L01631MH2021PLC35799"
                />
              </div>
            </div>
          </motion.div>

          {/* Section 2: Contact Information */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-premium p-8 sm:p-10 bg-white/95 backdrop-blur-sm border-none shadow-premium"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Contact Information</h3>
                <p className="text-xs text-slate-400 font-medium">Primary point of communication</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Contact Person</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                  placeholder="e.g. Devendra Sharma"
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="email"
                    required
                    readOnly
                    value={email}
                    className="w-full pl-11 pr-5 py-4 bg-slate-100 border border-slate-200 rounded-xl outline-none transition-all font-bold text-slate-500 cursor-not-allowed"
                    placeholder="email@company.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Address */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-8 sm:p-10 bg-white/95 backdrop-blur-sm border-none shadow-premium"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Address Details</h3>
                <p className="text-xs text-slate-400 font-medium">Headquarters or main operations facility</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-12 group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                  placeholder="e.g. 402, Block A, Industrial Area Phase II"
                />
              </div>

              <div className="md:col-span-3 group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                  placeholder="e.g. Pune"
                />
              </div>

              <div className="md:col-span-3 group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                  placeholder="e.g. Maharashtra"
                />
              </div>

              <div className="md:col-span-3 group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Country</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                  placeholder="e.g. India"
                />
              </div>

              <div className="md:col-span-3 group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2.5 ml-1">PIN Code</label>
                <input
                  type="text"
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                  placeholder="e.g. 411014"
                />
              </div>
            </div>
          </motion.div>



          {/* Error Message */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <p>{errorMessage}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
            <button
              type="button"
              onClick={() => navigate("/industry")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-700 transition-all text-xs uppercase tracking-widest"
            >
              Cancel & Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-10 py-5 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 active:scale-95 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-75"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Company Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
