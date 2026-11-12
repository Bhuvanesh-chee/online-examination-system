import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  WandSparkles,
  FilePlus2,
  ArrowRight,
  ShieldCheck,
  Timer,
  Zap,
  HelpCircle,
  FileCheck,
  BarChart3,
  Shuffle,
  Eye,
  Check,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      title: "AI Question Studio — Faculty Time Saver",
      description: "Choose Java, DSA or Frontend, enter a topic and Easy, Medium or Hard difficulty, then preview four-option MCQs with answer keys and explanations. Vetted offline samples work without an API key; live AI is optional.",
      icon: WandSparkles,
      color: "indigo",
    },
    {
      title: "One-Click Draft Exam Builder",
      description: "Edit generated questions, save them to the reusable bank, and assemble a hidden draft exam in the same workflow. Faculty reviews before publishing to students.",
      icon: FilePlus2,
      color: "purple",
    },
    {
      title: "Automated MCQ Engine with Negative Marking",
      description: "Instant server-side evaluation of 4-option multiple choice questions with customizable positive and negative mark weighting.",
      icon: Zap,
      color: "blue",
    },
    {
      title: "Descriptive & Essay Question Evaluation",
      description: "Long-form written responses with grading rubrics, instructor score awarding, and detailed inline feedback.",
      icon: FileCheck,
      color: "indigo",
    },
    {
      title: "Synchronized Countdown Timer & Auto-Submit",
      description: "Strict server-synchronized examination countdown that forces instant answer submission once the allocated window elapses.",
      icon: Timer,
      color: "emerald",
    },
    {
      title: "Anti-Cheating Deterrence & Visibility Tracking",
      description: "Monitors active browser focus, detects tab-switching, prompts fullscreen requirements, and records audit trail violations.",
      icon: ShieldCheck,
      color: "purple",
    },
    {
      title: "Live Proctoring & Candidate Session Monitor",
      description: "Administrative console showcasing currently active test-takers, time elapsed, and real-time security warning counts.",
      icon: Eye,
      color: "rose",
    },
    {
      title: "Question & Option Randomization",
      description: "Dynamically shuffles question presentation order and multiple-choice answer option sequences to foil peer collusion.",
      icon: Shuffle,
      color: "amber",
    },
    {
      title: "Continuous Response Auto-Saving",
      description: "Asynchronous background state saving ensures student answers are preserved through network blips and page refreshes.",
      icon: Lock,
      color: "sky",
    },
    {
      title: "In-Depth Performance Analytics",
      description: "Graphical score distributions, subject mastery breakdowns, accuracy rates, and percentile-level comparative benchmarks.",
      icon: BarChart3,
      color: "teal",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Functional Matrix
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900">Platform Features & Security</h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Every feature requested in Problem Statement #10 has been designed, developed, and connected to persistent PostgreSQL storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link href="/admin/generator" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700">
              Try the AI Question Studio <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-2 text-xs text-slate-500">Administrator login required. Offline demo samples need no API key.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
