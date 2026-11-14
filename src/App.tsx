/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "./supabaseClient";

import Navbar from "./components/Navbar";

// Route-based code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const FarmerDashboard = lazy(() => import("./pages/FarmerDashboard"));
const IndustryDashboard = lazy(() => import("./pages/IndustryDashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Training = lazy(() => import("./pages/Training"));
const Funding = lazy(() => import("./pages/Funding"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const Logout = lazy(() => import("./pages/Logout"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const FarmMonitor = lazy(() => import("./pages/FarmMonitor"));
const IndustryProfile = lazy(() => import("./pages/IndustryProfile"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

/* 🔐 PROTECTED ROUTE (ROLE-BASED ACCESS CONTROL) */
function ProtectedRoute(props: { children: JSX.Element; allowedRoles?: string[] }) {
  const { children, allowedRoles } = props;
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const activeRole = localStorage.getItem("activeRole");
        if (activeRole) {
          if (activeRole === "admin" || !allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(activeRole)) {
            setChecking(false);
            return;
          }
        }

        const { data } = await supabase.auth.getUser();

        if (!data?.user) {
          if (!activeRole) {
            navigate("/login");
            return;
          }
        }

        if (data?.user && allowedRoles && allowedRoles.length > 0) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          if (error || !profile) {
            navigate("/login");
            return;
          }

          // Superuser admin role bypasses all role constraints.
          // Other roles are restricted to the allowed roles list.
          if (profile.role !== "admin" && !allowedRoles.includes(profile.role)) {
            if (profile.role === "farmer") {
              navigate("/farmer");
            } else if (profile.role === "industry") {
              navigate("/industry");
            } else {
              navigate("/");
            }
            return;
          }
        }

        setChecking(false);
      } catch (err) {
        console.error("ProtectedRoute auth check failed:", err);
        navigate("/login");
      }
    }

    checkAuth();
  }, [navigate]);

  if (checking) return <div style={{ padding: "20px" }}>Checking authentication...</div>;

  return children;
}

function AppContent() {
  const location = useLocation();
  const isPortalRoute =
    location.pathname.startsWith("/industry") ||
    location.pathname.startsWith("/farmer") ||
    location.pathname.startsWith("/admin") ||
    location.pathname === "/training" ||
    location.pathname === "/funding" ||
    location.pathname === "/monitor";

  const showNavbar =
    !isPortalRoute && location.pathname !== "/login" && location.pathname !== "/logout";

  return (
    <div className="min-h-screen">
      {showNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />

          {/* 🔒 PROTECTED ROUTES */}
          <Route
            path="/farmer"
            element={
              <ProtectedRoute allowedRoles={["farmer"]}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/industry"
            element={
              <ProtectedRoute allowedRoles={["industry"]}>
                <IndustryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/industry/profile"
            element={
              <ProtectedRoute allowedRoles={["industry"]}>
                <IndustryProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/marketplace"
            element={
              <ProtectedRoute allowedRoles={["industry"]}>
                <Marketplace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/training"
            element={
              <ProtectedRoute allowedRoles={["farmer"]}>
                <Training />
              </ProtectedRoute>
            }
          />

          <Route
            path="/funding"
            element={
              <ProtectedRoute allowedRoles={["farmer"]}>
                <Funding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["industry"]}>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/confirmation"
            element={
              <ProtectedRoute allowedRoles={["industry"]}>
                <Confirmation />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/monitor"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <FarmMonitor />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
