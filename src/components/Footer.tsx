import Link from "next/link";
import { GraduationCap, ShieldCheck, Heart, Award, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Project Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#A12D33] flex items-center justify-center text-white shadow-lg shadow-[#A12D33]/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">KL UNIVERSITY</span>
                <span className="text-xs block text-slate-400">Online Examination Portal</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              A comprehensive, next-generation assessment platform engineered for universities, academic institutions, and recruitment assessments with anti-cheating deterrence, instant MCQ evaluation, and real-time monitoring.
            </p>

            {/* Academic Credentials Box */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 max-w-md">
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Academic Capstone Project Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div><span className="text-slate-400">Project ID:</span> 2500030116</div>
                <div><span className="text-slate-400">Problem #:</span> 10</div>
                <div className="col-span-2"><span className="text-slate-400">Student Name:</span> <strong>GAGIREDDY RAMREDDY</strong></div>
                <div className="col-span-2"><span className="text-slate-400">Department:</span> B.Tech Computer Science and Engineering</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Platform Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">
                  Home Landing
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  About Platform
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-blue-400 transition-colors">
                  Features & Security
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-400 transition-colors">
                  User Login Portal
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-400 transition-colors">
                  Student Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & System Highlights */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Security Architecture
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fullscreen deterrence monitor</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tab-switching violation logger</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Client-side answer key masking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Randomized questions & choices</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated countdown auto-submit</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 KL University — Online Examination Portal. All rights reserved.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Built with Next.js App Router, Tailwind CSS & PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
