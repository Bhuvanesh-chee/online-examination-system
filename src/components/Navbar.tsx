"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, LogOut, Menu, X, GraduationCap } from "lucide-react";
import { useState } from "react";
import { portalPath } from "@/lib/enterPortal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardLabel =
    user?.role === "admin" ? "Admin Panel" : user?.role === "teacher" ? "Teacher Portal" : "My Dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="bg-[#A12D33] text-white text-xs px-4 py-1.5 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide">
              KL UNIVERSITY
            </span>
            <span className="hidden sm:inline">Secure Online Examination Portal</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[#f3d6d8] text-[11px]">
            <span>Department of Computer Science &amp; Engineering</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#A12D33] flex items-center justify-center text-white shadow-md shadow-[#A12D33]/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg leading-tight">KL UNIVERSITY</div>
              <div className="text-[11px] text-slate-500 font-medium">
                Examination Management System
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-[#A12D33] transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-[#A12D33] transition-colors">
              About
            </Link>
            <Link href="/features" className="hover:text-[#A12D33] transition-colors">
              Features
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={portalPath(user.role)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A12D33]/10 text-[#A12D33] hover:bg-[#A12D33]/20 text-sm font-semibold transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {dashboardLabel}
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-[#A12D33] hover:bg-slate-50 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#A12D33] hover:bg-[#7d1f24] rounded-lg shadow-sm hover:shadow transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            About
          </Link>
          <Link
            href="/features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Features
          </Link>

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <Link
                  href={portalPath(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#A12D33] text-white font-medium text-sm justify-center"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {dashboardLabel}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm justify-center hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 rounded-lg bg-[#A12D33] text-white text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
