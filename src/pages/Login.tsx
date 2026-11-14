import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Factory,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Chrome,
  ShieldCheck,
  Verified,
  Trees,
  User
} from "lucide-react";

import { supabase } from "../supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"farmer" | "industry" | "admin">("industry");
  const [mode, setMode] = useState<"login" | "register" | "forgot-password" | "reset-password">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [oauthState, setOauthState] = useState<{
    signingIn: boolean;
    provider: "google" | "github" | null;
    status: string;
  }>({
    signingIn: false,
    provider: null,
    status: "",
  });

  const isExplicitAction = useRef(false);
  const verifyingOtpRef = useRef(false);

  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);

  const navigateBasedOnRole = async (userRole: string, userId: string) => {
    if (userRole === "admin") {
      localStorage.setItem("activeRole", "admin");
      navigate("/admin");
    } else if (userRole === "farmer") {
      navigate("/farmer");
    } else {
      // For industry users: check if they've already set up their company profile.
      // If not, send them to the profile setup page first.
      const { data: industryRecord } = await supabase
        .from("industries")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (industryRecord) {
        navigate("/industry");
      } else {
        navigate("/industry/profile");
      }
    }
  };

  const handleProfileAndRedirect = async (userId: string, enforceRole = false) => {
    // Check if user is still signed in before doing anything
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      // Create a profile for the user with the selected role
      const { error: insertError } = await supabase
        .from("profiles")
        .upsert([
          {
            id: userId,
            role: role,
            ...(name ? { full_name: name } : {}),
          },
        ]);

      if (insertError) {
        console.error("Error creating profile:", insertError);
        alert("Error saving your account role. Please try again.");
        return;
      }
      isExplicitAction.current = false;
      await navigateBasedOnRole(role, userId);
    } else {
      if (enforceRole && profile.role !== role) {
        isExplicitAction.current = false;
        await supabase.auth.signOut();
        alert(`This account is registered as ${profile.role.toUpperCase()}. Please select the ${profile.role.toUpperCase()} tab to sign in.`);
        return;
      }
      isExplicitAction.current = false;
      await navigateBasedOnRole(profile.role, userId);
    }
  };

  useEffect(() => {
    const roleParam = searchParams.get("role");
    const modeParam = searchParams.get("mode");

    if (roleParam === "farmer" || roleParam === "industry" || roleParam === "admin") {
      setRole(roleParam);
    } else if (searchParams.has("admin")) {
      // Supports /login?admin and /login?admin=true
      setRole("admin");
    }
    if (modeParam === "login" || modeParam === "register") {
      setMode(modeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    if (isRecovery) {
      verifyingOtpRef.current = true;
      setMode("reset-password");
    }

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isRecovery) {
        handleProfileAndRedirect(session.user.id);
      }
    });

    // Listen for auth state changes (crucial for OAuth redirect callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset-password");
      } else if (event === "SIGNED_IN" && session?.user) {
        if (verifyingOtpRef.current) {
          return;
        }
        await handleProfileAndRedirect(session.user.id, isExplicitAction.current);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [role]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const nextOtp = [...otpCode];
    nextOtp[index] = val;
    setOtpCode(nextOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendOtp = async () => {
    setResendTimer(60);
    await supabase.auth.signUp({
      email,
      password,
    });
  };

  const handleVerifyOtp = async () => {
    const enteredToken = otpCode.join("");
    if (enteredToken.length !== 6) {
      alert("Please enter all 6 digits of the verification code.");
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: enteredToken,
      type: "signup"
    });

    if (error) {
      alert(`Invalid verification code: ${error.message}`);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert([
          {
            id: data.user.id,
            role: role,
            ...(name ? { full_name: name } : {}),
          },
        ]);
      if (profileError) {
        console.error(profileError);
      }
      verifyingOtpRef.current = false;
      setVerifyingOtp(false);
      await handleProfileAndRedirect(data.user.id);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    if (role === "admin") {
      alert("Social login is disabled for the Administrator account. Please use password sign-in.");
      return;
    }
    isExplicitAction.current = true;
    setOauthState({
      signingIn: true,
      provider,
      status: `Connecting to ${provider === "google" ? "Google" : "GitHub"} Accounts...`,
    });

    // Phase 1: Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 800));
    setOauthState(prev => ({
      ...prev,
      status: "Retrieving secure user credentials...",
    }));

    // Phase 2: Create / Sign in with demo account
    const email = `${provider}-demo@carbonx.com`;
    const password = `DemoPassword123!`;

    await new Promise((resolve) => setTimeout(resolve, 800));
    setOauthState(prev => ({
      ...prev,
      status: "Authorizing session tokens...",
    }));

    try {
      // Try to sign in first
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Sign up if user doesn't exist
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user) {
          // Create profile for new demo user
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert([
              {
                id: signUpData.user.id,
                role: role, // Use currently selected role
              },
            ]);

          if (profileError) {
            console.error("Error creating demo profile:", profileError);
          }
          
          // Sign in again to establish session
          const { error: reSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (reSignInError) throw reSignInError;
          
          setOauthState(prev => ({ ...prev, status: "Synchronizing profile settings..." }));
          await new Promise((resolve) => setTimeout(resolve, 500));
          await handleProfileAndRedirect(signUpData.user.id, true);
        }
      } else if (signInData.user) {
        setOauthState(prev => ({ ...prev, status: "Synchronizing profile settings..." }));
        await new Promise((resolve) => setTimeout(resolve, 500));
        await handleProfileAndRedirect(signInData.user.id, true);
      }
    } catch (err: any) {
      alert(`Demo OAuth Error: ${err.message}`);
    } finally {
      setOauthState({ signingIn: false, provider: null, status: "" });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login",
    });
    if (error) {
      alert(error.message);
    } else {
      alert("A password reset link has been sent to your email address!");
      setMode("login");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      alert("Please enter a new password.");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Your password has been successfully updated! Logging you in...");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        verifyingOtpRef.current = false;
        await handleProfileAndRedirect(user.id);
      } else {
        setMode("login");
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      const normalizedEmail = email.trim().toLowerCase();
      const isAdminLogin = role === "admin" || normalizedEmail === "admin@gmail.com";

      if (isAdminLogin) {
        if (normalizedEmail !== "admin@gmail.com" || password !== "admin123") {
          alert("Access Denied: Invalid admin credentials. Default credentials are admin@gmail.com / admin123");
          return;
        }
        setRole("admin");
        isExplicitAction.current = false;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error || !data?.user) {
          console.warn("Supabase admin sign-in fallback to local demo mode:", error?.message);
        }
        localStorage.setItem("activeRole", "admin");
        navigate("/admin");
        return;
      }
      isExplicitAction.current = true;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        isExplicitAction.current = false;
        alert("Invalid email or password");
        return;
      }

      if (!data.user) {
        isExplicitAction.current = false;
        return;
      }
      await handleProfileAndRedirect(data.user.id, true);

    } else {
      if (role === "admin") {
        alert("Administrator accounts cannot be created online.");
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      verifyingOtpRef.current = true;
      setVerifyingOtp(true);
      setOtpCode(["", "", "", "", "", ""]);
      setResendTimer(60);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50/50 font-sans flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-[2.5rem] shadow-premium-hover shadow-emerald-900/10 overflow-hidden border border-slate-100">
        {/* Left Side: Form */}
        <div className="p-10 md:p-14">
          <div className="flex items-center gap-3 text-emerald-600 mb-10 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <Leaf className="size-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">CarbonX</span>
          </div>

          <AnimatePresence mode="wait">
            {verifyingOtp ? (
              <motion.div
                key="otp-verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none text-left">
                    Verify Your Email
                  </h1>
                  <p className="text-slate-500 mt-3 font-medium text-left">
                    We've sent a 6-digit verification code to <span className="text-slate-800 font-bold">{email}</span>.
                  </p>
                </div>

                <div className="flex gap-2 justify-between">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="size-10 md:size-12 text-center text-xl font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  className="btn-emerald w-full !py-4 !rounded-xl shadow-premium-hover shadow-emerald-900/10"
                >
                  Verify & Create Account
                </button>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <button
                    onClick={async () => {
                      verifyingOtpRef.current = false;
                      setVerifyingOtp(false);
                      await supabase.auth.signOut();
                    }}
                    className="hover:text-slate-600 transition-colors"
                  >
                    ← Back to Sign Up
                  </button>
                  {resendTimer > 0 ? (
                    <span>Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-emerald-600 hover:text-emerald-700 font-extrabold transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </motion.div>
            ) : mode === "forgot-password" ? (
              <motion.div
                key="forgot-password-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none text-left">
                    Reset Password
                  </h1>
                  <p className="text-slate-500 mt-3 font-medium text-left font-semibold">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-2.5 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium placeholder:text-slate-300"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-emerald w-full !py-4.5 !rounded-xl shadow-premium-hover shadow-emerald-900/10"
                  >
                    Send Reset Link
                  </button>
                </form>

                <div className="text-center mt-6">
                  <button
                    onClick={() => setMode("login")}
                    className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </motion.div>
            ) : mode === "reset-password" ? (
              <motion.div
                key="reset-password-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none text-left">
                    Create New Password
                  </h1>
                  <p className="text-slate-500 mt-3 font-medium text-left font-semibold">
                    Please choose a strong new password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-2.5 ml-1">New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-12 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium placeholder:text-slate-300"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-emerald w-full !py-4.5 !rounded-xl shadow-premium-hover shadow-emerald-900/10"
                  >
                    Update Password
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-10">
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none text-left">
                    {mode === "login" ? "Welcome Back" : "Join CarbonX"}
                  </h1>
                  <p className="text-slate-500 mt-3 font-medium text-left">
                    {mode === "login" ? "Access your carbon trading portal" : "Start your journey to Net Zero"}
                  </p>
                </div>


                {/* Role Toggle */}
                <div className="flex p-1.5 bg-slate-100/80 rounded-xl mb-6 border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setRole("industry")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${role === "industry"
                        ? "bg-white text-emerald-600 shadow-md shadow-emerald-900/5"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <Factory className="size-4" />
                    Industry
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("farmer")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${role === "farmer"
                        ? "bg-white text-emerald-600 shadow-md shadow-emerald-900/5"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <Leaf className="size-4" />
                    Farmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${role === "admin"
                        ? "bg-white text-emerald-600 shadow-md shadow-emerald-900/5"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <ShieldCheck className="size-4" />
                    Admin
                  </button>
                </div>

                {role === "admin" && (
                  <div className="mb-6 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs transition-all">
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                      <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                      <span>Admin Demo: <strong className="font-extrabold">admin@gmail.com</strong> / <strong className="font-extrabold">admin123</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("admin@gmail.com");
                        setPassword("admin123");
                      }}
                      className="text-[11px] font-extrabold text-emerald-700 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      Fill Credentials
                    </button>
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                  <AnimatePresence>
                    {mode === "register" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden"
                      >
                        <div className="text-left">
                          <label className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-2.5 ml-1">Full Name</label>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium placeholder:text-slate-300"
                              placeholder="John Doe"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-2.5 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium placeholder:text-slate-300"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="flex justify-between items-center mb-2.5 ml-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Password</label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot-password")}
                          className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-12 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium placeholder:text-slate-300"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  {mode === "login" && (
                    <div className="flex items-center gap-3 py-1 ml-1 text-left">
                      <input type="checkbox" id="remember" className="size-4 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer" />
                      <label htmlFor="remember" className="text-sm text-slate-500 font-semibold cursor-pointer select-none">Remember me for 30 days</label>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-emerald w-full !py-4.5 !rounded-xl shadow-premium-hover shadow-emerald-900/10"
                  >
                    {mode === "login" ? "Sign In to Dashboard" : "Create Your Account"}
                  </button>
                </form>

                <div className="mt-10">
                  <div className="relative flex items-center justify-center mb-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <span className="relative px-6 bg-white text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.3em]">Or continue with</span>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin("google")}
                      className="flex items-center justify-center gap-3 py-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-slate-600 text-sm active:scale-95"
                    >
                      <Chrome className="size-5" />
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin("github")}
                      className="flex items-center justify-center gap-3 py-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-slate-600 text-sm active:scale-95"
                    >
                      <Github className="size-5" />
                      GitHub
                    </button>
                  </div>
                </div>

                <p className="mt-10 text-center text-sm text-slate-400 font-medium">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="font-extrabold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {mode === "login" ? "Create Account" : "Sign In"}
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Visual/Marketing */}
        <div className="hidden md:block relative bg-slate-900 p-16 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/30 via-transparent to-transparent"></div>
            <Trees className="absolute -bottom-20 -right-20 size-[30rem] text-emerald-500/10" />
          </div>

          <div className="relative h-full flex flex-col justify-between z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest mb-10">
                Institutional Carbon Market
              </div>
              <h2 className="text-5xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight">
                Bridging the gap between <span className="text-emerald-400">Industry</span> and <span className="text-emerald-400">Nature</span>.
              </h2>
              <p className="text-slate-400 text-xl leading-relaxed font-medium">
                Join over 5,000 farmers and 200 industrial partners in the world's most transparent carbon credit ecosystem.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-5 group cursor-default">
                <div className="size-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                  <ShieldCheck className="text-emerald-400 size-7" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Verified Integrity</h4>
                  <p className="text-slate-500 text-sm font-medium">Gold Standard & Verra certified projects only.</p>
                </div>
              </div>
              <div className="flex items-center gap-5 group cursor-default">
                <div className="size-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                  <Verified className="text-emerald-400 size-7" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Real-time Settlement</h4>
                  <p className="text-slate-500 text-sm font-medium">Instant credit transfer via blockchain registry.</p>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-[0.2em] font-extrabold">
              <span>© 2026 CarbonX</span>
              <div className="flex gap-6">
                <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {oauthState.signingIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-premium-hover border border-slate-100 flex flex-col items-center"
            >
              <div className="relative mb-6">
                <div className="size-20 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {oauthState.provider === "google" ? (
                    <Chrome className="size-8 text-emerald-600 animate-pulse" />
                  ) : (
                    <Github className="size-8 text-slate-800 animate-pulse" />
                  )}
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Signing in with {oauthState.provider === "google" ? "Google" : "GitHub"}
              </h3>
              <p className="text-slate-500 font-semibold text-sm animate-pulse">
                {oauthState.status}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
