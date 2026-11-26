"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  GraduationCap,
  ShieldCheck,
  Zap,
  Timer,
  FileSpreadsheet,
  Award,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  BarChart,
  Users,
  Eye,
  ClipboardCheck,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#7d1f24] via-[#A12D33] to-[#5c1418] text-white pt-16 pb-24 lg:pt-20 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#6DBFEC]/20 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-10 right-10 w-80 h-80 bg-white/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-[#cfe9f8] shadow-inner">
              <Sparkles className="w-4 h-4 text-[#6DBFEC]" />
              <span>KL University • Secure Online Examination Portal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Secure Online <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#bfe4f7] via-white to-[#bfe4f7] bg-clip-text text-transparent">
                Examination System
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
              A single, administrator-approved portal for students, faculty and exam
              controllers — with automated grading, anti-cheating safeguards and resilient
              state saving.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-white text-[#A12D33] hover:bg-slate-100 font-semibold text-sm shadow-lg transition flex items-center gap-2"
              >
                Sign In <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/30 text-white font-medium text-sm transition"
              >
                Create Student Account
              </Link>
            </div>
          </div>

          <div className="mt-14 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <ShieldCheck className="w-5 h-5 text-[#6DBFEC] mb-2" />
              <div className="text-sm font-bold text-white">Admin Approved</div>
              <p className="text-xs text-slate-200 mt-1">
                New accounts stay locked until an administrator reviews and approves them.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <Users className="w-5 h-5 text-[#6DBFEC] mb-2" />
              <div className="text-sm font-bold text-white">Teacher Allocation</div>
              <p className="text-xs text-slate-200 mt-1">
                Administrators assign students to faculty so each teacher sees only their cohort.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <Lock className="w-5 h-5 text-[#6DBFEC] mb-2" />
              <div className="text-sm font-bold text-white">Server Enforced</div>
              <p className="text-xs text-slate-200 mt-1">
                Every role and approval check is verified on the server, not just the browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6">
          <div className="text-center p-2">
            <div className="text-3xl font-extrabold text-[#A12D33]">100%</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Automated MCQ Grading
            </div>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-[#A12D33]">&lt; 100ms</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Real-time Autosave
            </div>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-[#A12D33]">3-Tier</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              Anti-Cheating Guard
            </div>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-[#A12D33]">Full-Stack</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              PostgreSQL Persistence
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#A12D33] uppercase tracking-widest">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Everything Needed for Rigorous Online Assessments
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Designed to prevent academic dishonesty while delivering an intuitive,
              stress-free testing experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center mb-5">
                <Timer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Exam Timer</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Server-synchronized countdown with urgency warnings and unconditional
                auto-submission on timeout.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Anti-Cheating Mechanisms</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tab-switch detection, fullscreen enforcement, copy-paste blocking and
                automated suspicious activity logging.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Instant MCQ Evaluation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Server-side scoring with negative marking support, keeping answer keys
                hidden until evaluation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#fdf2f3] to-[#eaf6fc] border border-[#A12D33]/20 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#A12D33] text-white flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Question Studio</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate four-option MCQs by subject, topic and difficulty, then edit the
                answer key and save to a bank or draft exam.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center mb-5">
                <BarChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Performance Analytics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Student dashboards with subject-wise mastery, attempt trends, pass ratios
                and downloadable reports.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center mb-5">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Live Proctoring Monitor</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Real-time oversight of active examinees, tab-switch flags and incident
                history for administrators.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#A12D33] uppercase tracking-widest">
              Seamless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              How the Examination System Works
            </h2>
            <p className="text-slate-600 mt-3">
              A transparent, high-integrity pipeline from account approval to score release.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#A12D33] text-white text-xs font-bold">
                Step 1
              </span>
              <h4 className="font-bold text-slate-900 mt-2 mb-1">Approval & Allocation</h4>
              <p className="text-xs text-slate-600">
                Administrators approve accounts and assign students to teachers.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#A12D33] text-white text-xs font-bold">
                Step 2
              </span>
              <h4 className="font-bold text-slate-900 mt-2 mb-1">Exam & Bank Setup</h4>
              <p className="text-xs text-slate-600">
                Questions, time limits, negative marks and schedules are configured.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#A12D33] text-white text-xs font-bold">
                Step 3
              </span>
              <h4 className="font-bold text-slate-900 mt-2 mb-1">Secure Student Entry</h4>
              <p className="text-xs text-slate-600">
                Students read instructions, enter proctored fullscreen and start the timer.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 relative">
              <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#A12D33] text-white text-xs font-bold">
                Step 4
              </span>
              <h4 className="font-bold text-slate-900 mt-2 mb-1">Grading & Report</h4>
              <p className="text-xs text-slate-600">
                MCQs auto-evaluate on submit; descriptive answers undergo faculty review.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#A12D33] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Access the KL University Portal</h2>
          <p className="text-[#f3d6d8] max-w-xl mx-auto text-base">
            Sign in with your approved credentials. New students can register, and access
            is granted once an administrator approves the account.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-white text-[#A12D33] font-bold text-sm shadow hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-black/20 hover:bg-black/30 text-white border border-white/30 font-semibold text-sm transition"
            >
              Register as Student
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
