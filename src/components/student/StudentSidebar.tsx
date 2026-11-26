"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  History,
  Award,
  TrendingUp,
  User,
  LogOut,
  GraduationCap,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const studentNavItems = [
  { href: "/student/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/student/teachers", label: "My Teachers", icon: UserCheck },
  { href: "/student/exams", label: "Available Exams", icon: BookOpen },
  { href: "/student/history", label: "Exam History", icon: History },
  { href: "/student/results", label: "Results & Scorecard", icon: Award },
  { href: "/student/analytics", label: "Performance Analytics", icon: TrendingUp },
  { href: "/student/profile", label: "My Profile", icon: User },
];

export default function StudentSidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
        <Link href="/student/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#A12D33] flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-base leading-none">KL UNIVERSITY</span>
            <span className="text-[10px] block text-[#6DBFEC] font-semibold tracking-wider uppercase mt-0.5">
              Student Portal
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Student Portal
        </div>
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-[#A12D33] text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Student ID Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#A12D33] to-[#7d1f24] flex items-center justify-center font-bold text-white text-sm">
            {user?.name?.slice(0, 2).toUpperCase() || "ST"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.name || "Student"}</p>
            <p className="text-[11px] text-[#6DBFEC] font-mono truncate">
              ID: {user?.studentId || "2500030116"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
          >
            <ExternalLink className="w-3 h-3" /> Home
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center justify-center p-1.5 rounded-md bg-red-950/60 hover:bg-red-900/80 text-red-300 transition"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
