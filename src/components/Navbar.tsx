"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      {/* Academic Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white text-xs px-4 py-1.5 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide">
              PROJECT ID: 2500030116
            </span>
            <span className="hidden sm:inline">Online Examination System</span>
            <span className="text-blue-200 hidden md:inline">• Problem Statement #10</span>
          </div>
          <div className="flex items-center gap-3 text-blue-100 text-[11px]">
            <span>Student: <strong className="text-white">GAGIREDDY RAMREDDY</strong></span>
            <span className="hidden sm:inline">• B.Tech CSE</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg leading-tight flex items-center gap-1.5">
                ExamSphere
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Secure Online Examination Portal</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link href="/features" className="hover:text-blue-600 transition-colors">
              Features
            </Link>
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {user.role === "admin" ? "Admin Panel" : "My Dashboard"}
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
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
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

      {/* Mobile menu dropdown */}
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
                  href={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm justify-center"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {user.role === "admin" ? "Admin Dashboard" : "Student Dashboard"}
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
                  className="block w-full text-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
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
