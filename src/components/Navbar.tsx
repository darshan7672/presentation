import { Link, NavLink, useNavigate } from "react-router-dom";
import { Leaf, LogOut, ShoppingBag, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const linkBase =
  "relative text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors";
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${
    isActive
      ? "text-[#14532D] bg-emerald-50 font-bold"
      : "text-[#64748B] hover:text-[#14532D] hover:bg-[#F8FAF7]"
  }`;

export default function Navbar() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (profile) {
        if (profile.role === "admin") {
          const activeRole = localStorage.getItem("activeRole");
          setUserRole(activeRole || "admin");
        } else {
          setUserRole(profile.role);
        }
      } else {
        setUserRole(null);
      }
    };

    // Initial check: check localStorage first for demo sessions (e.g. admin)
    const storedRole = localStorage.getItem("activeRole");
    if (storedRole) {
      setUserRole(storedRole);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        fetchRole(data.user.id);
      } else {
        const activeRole = localStorage.getItem("activeRole");
        setUserRole(activeRole || null);
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        const activeRole = localStorage.getItem("activeRole");
        setUserRole(activeRole || null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-[#14532D] p-2 rounded-lg shadow-sm group-hover:bg-[#166534] transition-colors duration-200">
              <Leaf className="h-5 w-5 text-[#84CC16]" />
            </div>
            <div>
              <span className="text-xl font-display font-extrabold text-[#14532D] tracking-tight">
                Carbon<span className="text-[#16A34A]">X</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <NavLink to="/marketplace" className={linkClass}>
              Marketplace
            </NavLink>

            {userRole ? (
              <>
                <NavLink
                  to={userRole === "farmer" ? "/farmer" : userRole === "industry" ? "/industry" : "/admin"}
                  className={linkClass}
                >
                  Dashboard
                </NavLink>
                <span className="mx-2 h-4 w-px bg-[#E5E7EB]" aria-hidden="true" />
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {userRole}
                </span>
                <Link
                  to="/logout"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#1F2937] hover:text-[#14532D] px-3 py-1.5 rounded-lg hover:bg-[#F8FAF7]"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?mode=register"
                  className="px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
