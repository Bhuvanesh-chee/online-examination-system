"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  ShieldCheck,
  Zap,
  Timer,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  BarChart,
  Users,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import {
  useEnterPortal,
  sessionIsLive,
  COOKIE_BLOCKED_MESSAGE,
} from "@/lib/enterPortal";

export default function HomePage() {
  const { user, quickLogin } = useAuth();
  const enterPortal = useEnterPortal();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleQuickLogin = async (role: "admin" | "student") => {
    setDemoLoading(role);
    setDemoError(null);

    const res = await quickLogin(role);

    if (!res.success) {
      setDemoLoading(null);
      setDemoError(res.error ?? "Demo sign-in is unavailable right now.");
      return;
    }

    // Verify the cookie stuck before leaving the page.
    const live = await sessionIsLive();
    if (!live) {
      setDemoLoading(null);
      setDemoError(COOKIE_BLOCKED_MESSAGE);
      return;
    }

    enterPortal(role);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-950 text-white pt-16 pb-24 lg:pt-20 lg:pb-32">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-500/20 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-10 right-10 w-80 h-80 bg-purple-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Academic badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-blue-200 shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Project ID: 2500030116 • Problem Statement #10</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Next-Gen Secure <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                Online Examination System
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Engineered with automated MCQ evaluation, descriptive response grading, real-time anti-cheating deterrence, and resilient state saving for higher education and enterprise assessments.
            </p>

            {/* Quick Demo Access Bar */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xl mx-auto text-left shadow-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-3 flex items-center justify-between">
                <span>⚡ Instant One-Click Demo Access</span>
                <span className="text-[11px] text-slate-300 font-normal">No password needed</span>
              </div>
              {demoError && (
                <div role="alert" className="mb-3 p-2.5 rounded-lg bg-rose-500/20 border border-rose-300/50 text-[11px] text-rose-100 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-200" />
                  <span>{demoError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickLogin("admin")}
                  disabled={demoLoading !== null}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow transition group"
                >
                  <div className="text-left">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                      Login as Admin
                    </div>
                    <div className="text-[11px] text-blue-100">Prof. Ramreddy Admin</div>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickLogin("student")}
                  disabled={demoLoading !== null}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm shadow transition group"
                >
                  <div className="text-left">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-200" />
                      Login as Student
                    </div>
                    <div className="text-[11px] text-purple-100">Gagireddy Ramreddy (2500030116)</div>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm shadow-lg transition flex items-center gap-2"
              >
                Sign In With Credentials <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-medium text-sm transition"
              >
                Create Student Account
              </Link>
            </div>
          </div>

          {/* Academic Attribution Card */}
          <div className="mt-16 max-w-4xl mx-auto rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="p-3">
                <span className="text-[11px] uppercase tracking-wider text-blue-300 font-medium block">
                  Student Developer
                </span>
                <span className="text-sm font-bold text-white">GAGIREDDY RAMREDDY</span>
              </div>
              <div className="p-3">
                <span className="text-[11px] uppercase tracking-wider text-blue-300 font-medium block">
                  Project ID & Problem
                </span>
                <span className="text-sm font-bold text-white">2500030116 • Problem #10</span>
              </div>
              <div className="p-3">
                <span className="text-[11px] uppercase tracking-wider text-blue-300 font-medium block">
                  Department
                </span>
                <span className="text-sm font-bold text-white">B.Tech Computer Science & Eng.</span>
              </div>
              <div className="p-3">
                <span className="text-[11px] uppercase tracking-wider text-blue-300 font-medium block">
                  Core Architecture
                </span>
                <span className="text-sm font-bold text-white">Next.js 16 + Drizzle ORM + Postgres</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6">
          <div className="text-center p-2">
            <div className="text-3xl font-extrabold text-blue-600">100%</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Automated MCQ Grading
            </div>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-indigo-600">&lt; 100ms</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Real-time Autosave
            </div>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-purple-600">3-Tier</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Anti-Cheating Guard
            </div>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-emerald-600">Full-Stack</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              PostgreSQL Persistence
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Everything Needed for Rigorous Online Assessments
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Designed from the ground up to prevent academic dishonesty while delivering an intuitive, stress-free testing experience for students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Timer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Exam Timer</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Precise client-server synchronized countdown timer with visual urgency warnings and unconditional auto-submission upon timeout expiration.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Anti-Cheating Mechanisms</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Browser tab-switch detection, fullscreen enforcement deterrents, copy-paste blocking, and automated suspicious activity incident logging.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Instant MCQ Evaluation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Server-side scoring algorithm computes objective marks instantaneously with negative marking support while strictly masking answer keys until evaluation.
              </p>
            </div>

            {/* Feature 4 · The project's distinctive faculty workflow */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Question Studio</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose Java, DSA or Frontend, enter a topic and Easy, Medium or Hard difficulty. Review four-option MCQs, edit the answer key, then save to a bank or draft exam. Offline samples work without an API key.
              </p>
              <Link href="/admin/generator" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline">Explore the admin studio <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <BarChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Performance Analytics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Comprehensive student dashboards with subject-wise mastery, historical attempt trends, pass/fail ratios, and downloadable academic reports.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Live Proctoring Monitor</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Live oversight feed for administrators to monitor active student examinees, track tab-switch flags in real time, and terminate cheating attempts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Seamless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              How the Examination System Works
            </h2>
            <p className="text-slate-600 mt-3">
              A transparent, high-integrity pipeline from question creation to instant score release.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                Step 1
              </span>
              <h4 className="font-bold text-slate-900 mt-2 mb-1">Exam & Bank Setup</h4>
              <p className="text-xs text-slate-600">
                Admin creates questions, configures time limits, negative marks, and schedule.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                Step 2
              </span>
              <h4 className="font-bold text-slate-900 mt-2 mb-1">Secure Student Entry</h4>
              <p className="text-xs text-slate-600">
                Student reads instructions, launches proctored fullscreen mode, and starts timer.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-purple-600 text-white text-xs font-bold">
                Step 3
              </span>
              <h4 className="font-bold text-slate-900 mt-2 mb-1">Live Answering & Guard</h4>
              <p className="text-xs text-slate-600">
                Continuous background auto-save preserves answers; tab switches are logged instantly.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                Step 4
              </span>
              <h4 className="font-bold text-slate-900 mt-2 mb-1">Instant Grading & Report</h4>
              <p className="text-xs text-slate-600">
                MCQs auto-evaluate on submit; descriptive answers undergo manual faculty review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to Explore the Platform?</h2>
          <p className="text-blue-100 max-w-xl mx-auto text-base">
            Log in with the preloaded administrator or student account to test live examinations, question creation, proctoring alerts, and analytics.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleQuickLogin("student")}
              className="px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shadow hover:bg-blue-50 transition"
            >
              Test as Student (Gagireddy Ramreddy)
            </button>
            <button
              onClick={() => handleQuickLogin("admin")}
              className="px-6 py-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-900/90 text-white border border-indigo-400/40 font-semibold text-sm transition"
            >
              Test as Administrator
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
