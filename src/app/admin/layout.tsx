"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEnterPortal, sessionIsLive, COOKIE_BLOCKED_MESSAGE } from "@/lib/enterPortal";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, quickLogin } = useAuth();
  const enterPortal = useEnterPortal();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  const handleDemoAdmin = async () => {
    setGateError(null);
    setGateBusy(true);
    const res = await quickLogin("admin");
    if (!res.success) {
      setGateBusy(false);
      setGateError(res.error ?? "Demo sign-in is unavailable right now.");
      return;
    }
    if (!(await sessionIsLive())) {
      setGateBusy(false);
      setGateError(COOKIE_BLOCKED_MESSAGE);
      return;
    }
    enterPortal("admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-slate-400">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Authorization Required</h2>
          <p className="text-sm text-slate-600 mb-6">
            You must be signed in with an administrator account to access the proctoring and exam management suite.
          </p>
          <div className="space-y-3">
            {gateError && (
              <div role="alert" className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-left text-[11px] text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                <span>{gateError}</span>
              </div>
            )}
            <button
              onClick={handleDemoAdmin}
              disabled={gateBusy}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition shadow flex items-center justify-center gap-2"
            >
              {gateBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {gateBusy ? "Signing you in..." : "One-Click Demo Admin Login (admin@exam.edu)"}
            </button>
            <Link
              href="/login"
              className="block w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
            >
              Sign In With Different Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <AdminNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
