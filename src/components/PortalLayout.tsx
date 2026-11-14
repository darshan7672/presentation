import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Leaf,
  LogOut,
  LayoutDashboard,
  Building2,
  Calculator,
  ShoppingBag,
  Receipt,
  FileBarChart2,
  Settings,
  User,
  Trees,
  GraduationCap,
  FolderKanban,
  Wallet,
  Users,
  ShieldCheck,
  CreditCard,
  LineChart,
  Menu,
  X,
  Bell,
  ChevronRight,
  ExternalLink,
  Search,
  Sparkles,
  ChevronDown,
  Satellite
} from "lucide-react";
import { supabase } from "../supabaseClient";

export type PortalType = "industry" | "farmer" | "admin";

interface PortalLayoutProps {
  portalRole: PortalType;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: string;
}

const INDUSTRY_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "Company Profile", icon: Building2 },
  { id: "calculator", label: "Emission Calculator", icon: Calculator },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { id: "purchases", label: "My Purchases", icon: Receipt },
  { id: "reports", label: "Reports", icon: FileBarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const FARMER_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "My Profile", icon: User },
  { id: "registration", label: "Farm Registration", icon: Trees },
  { id: "calculator", label: "Carbon Calculator", icon: Calculator },
  { id: "training", label: "Training Centre", icon: GraduationCap, href: "/training" },
  { id: "projects", label: "My Projects", icon: FolderKanban },
  { id: "wallet", label: "Earnings & Wallet", icon: Wallet },
  { id: "settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "farmers", label: "Farmers", icon: Users },
  { id: "industries", label: "Industries", icon: Building2 },
  { id: "verification", label: "Project Verification", icon: ShieldCheck, badge: "Pending" },
  { id: "monitor", label: "Satellite Farm Monitor", icon: Satellite, badge: "AI MRV" },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function PortalLayout({
  portalRole,
  activeTab = "dashboard",
  onTabChange,
  title,
  subtitle,
  actions,
  children,
}: PortalLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("user@carbonx.eco");
  const [userRole, setUserRole] = useState<string>(portalRole);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Carbon Credit Batch Verified", time: "10m ago", read: false },
    { id: 2, title: "ESG Compliance Report Ready", time: "1h ago", read: false },
    { id: 3, title: "Marketplace liquidity update", time: "1d ago", read: true },
  ]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  const navItems =
    portalRole === "industry"
      ? INDUSTRY_NAV
      : portalRole === "farmer"
      ? FARMER_NAV
      : ADMIN_NAV;

  const roleColorBadge =
    portalRole === "industry"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : portalRole === "farmer"
      ? "bg-lime-50 text-lime-800 border-lime-300"
      : "bg-slate-900 text-white border-slate-700";

  const handleNavClick = (item: NavItem) => {
    setMobileMenuOpen(false);
    if (item.href) {
      navigate(item.href);
      return;
    }
    if (onTabChange) {
      onTabChange(item.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1F2937] flex flex-col lg:flex-row antialiased font-sans">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#14532D] flex items-center justify-center text-white shadow-sm">
            <Leaf className="w-4 h-4 text-[#84CC16]" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-[#14532D] tracking-tight">
              Carbon<span className="text-[#16A34A]">X</span>
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleColorBadge}`}>
            {portalRole}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#14532D] hover:bg-[#F8FAF7]"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 xl:w-72 shadow-sm ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#14532D] flex items-center justify-center text-white shadow-md group-hover:bg-[#166534] transition-all">
              <Leaf className="w-5 h-5 text-[#84CC16]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl text-[#14532D] tracking-tight">
                  Carbon<span className="text-[#16A34A]">X</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest uppercase bg-[#14532D]/10 text-[#14532D] px-1.5 py-0.5 rounded">
                  SaaS
                </span>
              </div>
              <p className="text-[10px] text-[#64748B] font-medium tracking-tight">
                Empowering Industries. Rewarding Farmers.
              </p>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-[#64748B] hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-3 mb-2">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isTabActive = activeTab === item.id;
            const isRouteActive = item.href && location.pathname === item.href;
            const isActive = isTabActive || isRouteActive;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-[#14532D] text-white shadow-sm"
                    : "text-[#1F2937] hover:bg-[#F8FAF7] hover:text-[#14532D]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#84CC16]" : "text-[#64748B] group-hover:text-[#14532D]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Cross-Links */}
          <div className="pt-4 mt-4 border-t border-[#E5E7EB]">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-3 mb-2">
              Market & Tools
            </div>
            <Link
              to="/marketplace"
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#14532D] hover:bg-[#F8FAF7] transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[#16A34A]" />
              <span>Credit Marketplace</span>
            </Link>
            {portalRole === "farmer" && (
              <Link
                to="/funding"
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#14532D] hover:bg-[#F8FAF7] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#84CC16]" />
                <span>Capital Grant Support</span>
              </Link>
            )}
            {portalRole === "admin" && (
              <Link
                to="/monitor"
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#14532D] hover:bg-[#F8FAF7] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-[#14532D]" />
                <span>Satellite Farm Monitor</span>
              </Link>
            )}
          </div>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAF7]/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#14532D] text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {userEmail.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1F2937] truncate">{userEmail}</p>
                <p className="text-[10px] text-[#64748B] capitalize">{portalRole} User</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="hidden lg:flex bg-white border-b border-[#E5E7EB] h-16 px-8 items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Link to="/" className="hover:text-[#14532D] font-medium">CarbonX</Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#E5E7EB]" />
              <span className="font-semibold text-[#14532D] capitalize">{portalRole}</span>
              {activeTab && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-[#E5E7EB]" />
                  <span className="text-[#1F2937] font-semibold capitalize">{activeTab.replace(/-/g, " ")}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Environmental Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>MRV Satellite Verification Online</span>
            </div>

            {/* Notifications Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-[#64748B] hover:text-[#14532D] hover:bg-[#F8FAF7] transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#16A34A]" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">Notifications</span>
                    <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">2 New</span>
                  </div>
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 rounded-lg bg-[#F8FAF7] hover:bg-emerald-50/50 transition-colors cursor-pointer text-left">
                        <p className="text-xs font-semibold text-[#1F2937]">{n.title}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="w-full mt-3 pt-2 border-t border-[#E5E7EB] text-center text-xs font-semibold text-[#16A34A] hover:underline"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-[#E5E7EB]" />

            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#14532D] hover:bg-[#166534] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#84CC16]" />
              <span>Explore Credits</span>
            </Link>
          </div>
        </header>

        {/* Page Header (if title provided) */}
        {(title || actions) && (
          <div className="bg-white border-b border-[#E5E7EB] px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-extrabold text-[#1F2937] tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-[#64748B] mt-1 font-medium">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          </div>
        )}

        {/* Dynamic Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Enterprise Footer */}
        <footer className="border-t border-[#E5E7EB] bg-white px-8 py-5 text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#14532D]">CarbonX</span>
            <span>&bull;</span>
            <span>Enterprise Climate-Tech & Carbon Management Platform</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> ISO 14064-2 Compliant
            </span>
            <span className="text-[#64748B]">Verra VCS & Gold Standard Audited</span>
            <Link to="/" className="text-[#14532D] hover:underline font-semibold">
              Platform Home
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
