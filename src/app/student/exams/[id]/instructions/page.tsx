"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  Clock,
  Award,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Maximize2,
  FileText,
} from "lucide-react";

interface ExamDetails {
  id: number;
  title: string;
  code: string;
  description: string | null;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  instructions: string | null;
  maxAttempts: number;
}

export default function ExamInstructionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [canAttempt, setCanAttempt] = useState(true);
  const [inProgressAttemptId, setInProgressAttemptId] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamInfo();
  }, [examId]);

  const fetchExamInfo = async () => {
    try {
      const res = await portalFetch(`/api/student/exams/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
        setQuestionCount(data.questionCount);
        setCanAttempt(data.canAttempt);
        setInProgressAttemptId(data.inProgressAttemptId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    if (!agreed) return;

    // Attempt to request fullscreen if allowed by browser
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // ignore fullscreen permission errors in restrictive sandbox environments
      });
    }

    router.push(`/student/exams/${examId}/live`);
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm">Loading examination parameters...</span>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Examination Not Found</h2>
        <Link
          href="/student/exams"
          className="text-xs text-blue-600 hover:underline mt-2 inline-block"
        >
          Return to examinations list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/student/exams"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {exam.code}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{exam.title}</h1>
        </div>
      </div>

      {/* Candidate Verification Card */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 shadow-sm">
        <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
          Verified Examinee Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
          <div>
            <span className="text-slate-400 block text-[11px]">Candidate Name</span>
            <strong className="text-slate-900 text-sm">{user?.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Student ID / Roll No</span>
            <strong className="text-blue-700 font-mono text-sm">{user?.studentId || "2500030116"}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Department</span>
            <strong className="text-slate-900">{user?.department || "CSE"}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Email Address</span>
            <span className="text-slate-600 truncate block">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Exam Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
          <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Allocated Time</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{exam.durationMinutes} Minutes</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
          <Award className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Marks</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{exam.totalMarks} Marks</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Passing Score</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{exam.passingMarks} Marks</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
          <HelpCircle className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Items</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{questionCount} Questions</div>
        </div>
      </div>

      {/* Anti-Cheating & Technical Guidelines */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          Anti-Cheating Rules & Security Protocol
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p>
              <strong>Synchronized Auto-Submission:</strong> A countdown timer will run continuously. The examination will automatically submit when the timer expires, even if you are in the middle of typing.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p>
              <strong>Active Tab & Visibility Monitoring:</strong> Do NOT navigate away from this browser window or switch tabs. Any tab-switching or window minimize event is logged in the proctor audit log and will trigger a warning.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p>
              <strong>Real-Time Continuous Autosave:</strong> Every answer you select or type is securely committed in the background to the PostgreSQL database. If your page reloads, your progress is safely restored.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <p>
              <strong>Navigation Palette:</strong> You may navigate freely between questions using the question grid, and mark questions for review before submitting.
            </p>
          </div>
        </div>

        {/* Custom Exam Instructions */}
        {exam.instructions && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Course Specific Instructions:
            </span>
            <p className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
              {exam.instructions}
            </p>
          </div>
        )}
      </div>

      {/* Acknowledgment & Start CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs sm:text-sm text-slate-800 font-medium">
            I confirm that I am <strong>{user?.name}</strong> (Roll: {user?.studentId || "2500030116"}), that I have read all instructions, and I agree to strictly adhere to the academic honesty policy.
          </span>
        </label>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/student/exams"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-center"
          >
            Cancel & Return
          </Link>

          <button
            onClick={handleStartExam}
            disabled={!agreed}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2 ${
              agreed
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Maximize2 className="w-4 h-4" />
            <span>Launch Exam & Start Timer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
