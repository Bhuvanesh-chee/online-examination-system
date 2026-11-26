"use client";

import { useAuth } from "@/context/AuthContext";
import { Menu, LogOut } from "lucide-react";

export default function TeacherNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
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
        <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-[#A12D33]/10 text-[#A12D33] border border-[#A12D33]/20">
          Teacher Role
        </span>
        <span className="text-xs text-slate-500 font-medium hidden md:inline">
          KL University • Faculty Workspace
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-slate-800">{user?.name || "Teacher"}</p>
          <p className="text-[10px] text-slate-500">{user?.department || "Faculty"}</p>
        </div>
        <button
          onClick={() => logout()}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-lg transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
