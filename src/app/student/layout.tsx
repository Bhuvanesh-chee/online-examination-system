"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentNavbar from "@/components/student/StudentNavbar";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEnterPortal, sessionIsLive, COOKIE_BLOCKED_MESSAGE } from "@/lib/enterPortal";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, quickLogin } = useAuth();
  const enterPortal = useEnterPortal();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  const handleDemoStudent = async () => {
    setGateError(null);
    setGateBusy(true);
    const res = await quickLogin("student");
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
    enterPortal("student");
  };

  // If on the live examination screen, render full-bleed without sidebar for proctored focus
  const isLiveExam = pathname.includes("/live");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-slate-400">Loading student session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Student Login Required</h2>
          <p className="text-sm text-slate-600 mb-6">
            Please sign in to your student account to access your examination portal and test history.
          </p>
          <div className="space-y-3">
            {gateError && (
              <div role="alert" className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-left text-[11px] text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                <span>{gateError}</span>
              </div>
            )}
            <button
              onClick={handleDemoStudent}
              disabled={gateBusy}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition shadow flex items-center justify-center gap-2"
            >
              {gateBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {gateBusy ? "Signing you in..." : "One-Click Demo Student Login (Gagireddy Ramreddy)"}
            </button>
            <Link
              href="/login"
              className="block w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
            >
              Sign In With Custom Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLiveExam) {
    return <div className="min-h-screen bg-slate-900 text-slate-100">{children}</div>;
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
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <StudentNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
