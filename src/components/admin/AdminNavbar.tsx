"use client";

import { useAuth } from "@/context/AuthContext";
import { Menu, Bell, Shield, LogOut, CheckCircle2 } from "lucide-react";

export default function AdminNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Administrator Role
          </span>
          <span className="text-xs text-slate-500 font-medium hidden md:inline">
            Project 2500030116 • GAGIREDDY RAMREDDY
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Proctoring Active</span>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{user?.name || "Administrator"}</p>
            <p className="text-[10px] text-slate-500">{user?.department || "CSE Department"}</p>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
