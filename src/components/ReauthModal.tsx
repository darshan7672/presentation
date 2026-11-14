import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  actionName?: string;
}

export function ReauthModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Security Verification Required",
  actionName = "perform this sensitive action",
}: ReauthModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReauthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        throw new Error("No active user session found. Please log in again.");
      }

      // 1. Re-verify user password with Supabase Auth
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password,
      });

      if (signInErr) {
        throw new Error("Invalid password. Re-authentication failed.");
      }

      // 2. Execute target sensitive action upon successful re-auth
      await onConfirm();
      setPassword("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Re-authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 text-emerald-400 mb-2">
          <Lock className="w-6 h-6" />
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Please confirm your password to {actionName}.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReauthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition flex items-center gap-2"
            >
              {loading ? "Verifying..." : "Confirm & Proceed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
