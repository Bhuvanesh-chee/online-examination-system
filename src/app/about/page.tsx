import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GraduationCap, Award, Shield, CheckCircle2, Server, Database, Code, BookOpen } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-b from-blue-900 to-indigo-950 text-white py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200 uppercase tracking-widest border border-white/20">
              Project Documentation
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">About ExamSphere</h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg">
              A state-of-the-art Web-Based Online Examination & Proctoring Management System.
            </p>
          </div>
        </section>

        {/* Project Credentials Table */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Academic Project Specification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold">Project Title</span>
                <p className="font-bold text-slate-800 mt-0.5">Online Examination System</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold">Student Name</span>
                <p className="font-bold text-slate-800 mt-0.5">GAGIREDDY RAMREDDY</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold">Project ID / Roll No</span>
                <p className="font-bold text-blue-600 font-mono mt-0.5">2500030116</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold">Department</span>
                <p className="font-bold text-slate-800 mt-0.5">B.Tech Computer Science and Engineering</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold">Problem Statement</span>
                <p className="font-bold text-slate-800 mt-0.5">Problem Statement #10</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold">Implementation Stack</span>
                <p className="font-bold text-slate-800 mt-0.5">Next.js 16, React 19, Drizzle ORM, PostgreSQL</p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Philosophy */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Project Overview & Objectives</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Modern digital education demands assessment systems that balance seamless user experience with rigorous academic integrity. This Online Examination System facilitates end-to-end remote testing for universities, training centers, and enterprise recruitment.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Administrators and faculty can author standardized question banks, configure customizable time windows, define negative marking rules, and monitor test sessions in real time. Students experience an intuitive, responsive examination environment backed by real-time answer persistence, automatic countdown timers, and immediate feedback on objective questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">High Integrity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Client-side deterrence, randomized question delivery, tab-switch monitoring, and complete server-side grade computation prevent client manipulation.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Resilient Autosave</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Candidate answers are dispatched asynchronously to the database on selection, ensuring accidental browser reloads do not wipe progress.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Relational Modeling</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Robust relational architecture tracking users, question banks, scheduled exams, attempts, answer entries, and timestamped security logs.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
