"use client";

import { useAuth } from "@/context/AuthContext";
import { Menu, LogOut, GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function StudentNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Student Assessment Portal
          </span>
          <span className="text-xs text-slate-500 hidden md:inline">
            Project ID: 2500030116 • GAGIREDDY RAMREDDY
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/student/exams"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-sm"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Take an Exam
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{user?.name || "Student"}</p>
            <p className="text-[10px] text-slate-500 font-mono">
              Roll No: {user?.studentId || "2500030116"}
            </p>
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
