"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Send,
  Loader2,
  HelpCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Lock,
} from "lucide-react";

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: number;
  questionText: string;
  type: string;
  options: QuestionOption[];
  marks: number;
  negativeMarks: number;
  difficulty: string;
}

interface ExamMeta {
  id: number;
  title: string;
  code: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string | null;
}

interface StudentMeta {
  id: number;
  name: string;
  rollNo: string | null;
  email: string;
  department: string | null;
}

interface AnswerRecord {
  selectedOption?: string | null;
  descriptiveAnswer?: string | null;
  isMarkedForReview: boolean;
  isDirty?: boolean;
}

export default function LiveExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [exam, setExam] = useState<ExamMeta | null>(null);
  const [student, setStudent] = useState<StudentMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers Map (keyed by questionId)
  const [answers, setAnswers] = useState<{ [qId: number]: AnswerRecord }>({});

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<number>(1800);
  const [timerExpired, setTimerExpired] = useState(false);

  // Anti-cheating
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastWarningMsg, setLastWarningMsg] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // UI status
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState<"all" | "answered" | "unanswered" | "review">("all");

  const saveTimeoutRef = useRef<{ [qId: number]: NodeJS.Timeout }>({});

  // 1. Initialize or resume session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const res = await portalFetch(`/api/student/exams/${examId}/start`, {
          method: "POST",
        });

        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Unable to start exam session.");
          router.push("/student/exams");
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        setAttemptId(data.attemptId);
        setExam(data.exam);
        setStudent(data.student);
        setQuestions(data.questions || []);
        setTimeRemaining(data.timeRemainingSeconds);
        setTabSwitchWarnings(data.tabSwitchCount || 0);

        // Prepopulate saved answers
        const ansMap: { [qId: number]: AnswerRecord } = {};
        for (const a of data.savedAnswers || []) {
          ansMap[a.questionId] = {
            selectedOption: a.selectedOption,
            descriptiveAnswer: a.descriptiveAnswer,
            isMarkedForReview: a.isMarkedForReview,
          };
        }
        setAnswers(ansMap);
        setLoading(false);
      } catch (err) {
        console.error("Init exam error:", err);
        alert("Network error starting exam. Please reload.");
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [examId, router]);

  // 2. Continuous Countdown Timer
  useEffect(() => {
    if (loading || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeRemaining]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timerExpired && attemptId && !submitting) {
      handleFinalSubmit(true);
    }
  }, [timerExpired, attemptId, submitting]);

  // 3. Save Answer to Server
  const saveAnswerToServer = useCallback(
    async (qId: number, record: AnswerRecord) => {
      if (!attemptId) return;
      setAutosaveStatus("saving");

      try {
        const res = await portalFetch(`/api/student/attempts/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: qId,
            selectedOption: record.selectedOption,
            descriptiveAnswer: record.descriptiveAnswer,
            isMarkedForReview: record.isMarkedForReview,
          }),
        });

        if (res.ok) {
          setAutosaveStatus("saved");
        } else {
          setAutosaveStatus("error");
        }
      } catch {
        setAutosaveStatus("error");
      }
    },
    [attemptId]
  );

  // 4. Update Answer in local state & schedule debounced server save
  const updateAnswer = (
    qId: number,
    updates: Partial<AnswerRecord>,
    immediate: boolean = false
  ) => {
    setAnswers((prev) => {
      const current = prev[qId] || { isMarkedForReview: false };
      const updated = { ...current, ...updates };

      if (saveTimeoutRef.current[qId]) {
        clearTimeout(saveTimeoutRef.current[qId]);
      }

      if (immediate) {
        saveAnswerToServer(qId, updated);
      } else {
        saveTimeoutRef.current[qId] = setTimeout(() => {
          saveAnswerToServer(qId, updated);
        }, 600);
      }

      return { ...prev, [qId]: updated };
    });
  };

  // 5. Anti-cheating event listeners
  const logSuspiciousActivity = useCallback(
    async (eventType: string, details: string) => {
      if (!attemptId) return;

      try {
        const res = await portalFetch(`/api/student/attempts/${attemptId}/log-suspicious`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType, details }),
        });

        if (res.ok) {
          const data = await res.json();
          setTabSwitchWarnings(data.tabSwitchCount || 0);
          setLastWarningMsg(data.warningMessage || "Suspicious focus loss recorded.");
          setShowWarningModal(true);
        }
      } catch (err) {
        console.error("Log error:", err);
      }
    },
    [attemptId]
  );

  useEffect(() => {
    if (loading || !attemptId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSuspiciousActivity(
          "tab_switch",
          "Candidate navigated away or changed active browser tab."
        );
      }
    };

    const handleWindowBlur = () => {
      logSuspiciousActivity(
        "window_blur",
        "Candidate blurred the examination window."
      );
    };

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull) {
        logSuspiciousActivity(
          "fullscreen_exit",
          "Candidate exited full-screen proctoring mode."
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [loading, attemptId, logSuspiciousActivity]);

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 6. Submit Examination
  const handleFinalSubmit = async (isAuto: boolean = false) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);

    try {
      const res = await portalFetch(`/api/student/attempts/${attemptId}/submit`, {
        method: "POST",
      });

      if (res.ok) {
        router.push(`/student/results?attemptId=${attemptId}`);
      } else {
        const err = await res.json();
        alert(err.error || "Submission failed. Please try again.");
        setSubmitting(false);
      }
    } catch {
      alert("Network error submitting exam. Please check connection and try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <h2 className="text-lg font-bold">Initializing Secure Examination Environment</h2>
        <p className="text-xs text-slate-400">
          Synchronizing question bank, seed order, and timer with server...
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAns = currentQ ? answers[currentQ.id] : undefined;

  // Format Timer mm:ss
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isUrgent = timeRemaining < 300; // < 5 minutes
  const isCritical = timeRemaining < 120; // < 2 minutes

  // Calculate palette metrics
  const totalQuestions = questions.length;
  let answeredCount = 0;
  let markedCount = 0;

  for (const q of questions) {
    const a = answers[q.id];
    if (a) {
      if (a.selectedOption || (a.descriptiveAnswer && a.descriptiveAnswer.trim().length > 0)) {
        answeredCount++;
      }
      if (a.isMarkedForReview) {
        markedCount++;
      }
    }
  }
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Header Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow">
            {exam?.code?.slice(0, 3) || "EXM"}
          </div>
          <div>
            <div className="font-bold text-white text-sm sm:text-base leading-tight truncate max-w-xs sm:max-w-md">
              {exam?.title}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Candidate: <strong className="text-slate-200">{student?.name}</strong></span>
              <span className="font-mono text-blue-400 hidden sm:inline">({student?.rollNo || "2500030116"})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Autosave status indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            {autosaveStatus === "saving" && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span className="text-[11px]">Saving answer...</span>
              </>
            )}
            {autosaveStatus === "saved" && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Answers Saved</span>
              </>
            )}
            {autosaveStatus === "error" && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-amber-400">Save pending</span>
              </>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs hidden sm:flex items-center gap-1.5 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Countdown Timer Display */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-all shadow-inner ${
              isCritical
                ? "bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse"
                : isUrgent
                ? "bg-amber-950/80 border-amber-500 text-amber-300"
                : "bg-slate-800 border-slate-700 text-emerald-400"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          {/* Submit Exam Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* 2. Main Examination Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Active Question Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          {currentQ ? (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {/* Question Index & Action Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-400">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      currentQ.type === "mcq"
                        ? "bg-blue-950 text-blue-300 border border-blue-800"
                        : "bg-purple-950 text-purple-300 border border-purple-800"
                    }`}
                  >
                    {currentQ.type}
                  </span>
                  <span className="text-xs text-slate-400">Difficulty: {currentQ.difficulty}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    +{currentQ.marks} Marks
                  </span>
                  {currentQ.negativeMarks > 0 && (
                    <span className="text-xs font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                      -{currentQ.negativeMarks} Negative
                    </span>
                  )}
                  <button
                    onClick={() =>
                      updateAnswer(
                        currentQ.id,
                        { isMarkedForReview: !currentAns?.isMarkedForReview },
                        true
                      )
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                      currentAns?.isMarkedForReview
                        ? "bg-purple-900/80 border-purple-500 text-purple-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{currentAns?.isMarkedForReview ? "Marked for Review" : "Mark for Review"}</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
                {currentQ.questionText}
              </div>

              {/* MCQ Options */}
              {currentQ.type === "mcq" && (
                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((opt) => {
                    const isSelected =
                      (currentAns?.selectedOption || "").toLowerCase() === opt.id.toLowerCase();

                    return (
                      <div
                        key={opt.id}
                        onClick={() =>
                          updateAnswer(currentQ.id, { selectedOption: opt.id }, true)
                        }
                        className={`p-4 rounded-xl border cursor-pointer transition flex items-center gap-3.5 ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {opt.id}
                        </div>
                        <span className="text-sm flex-1 leading-snug">{opt.text}</span>
                      </div>
                    );
                  })}

                  {currentAns?.selectedOption && (
                    <button
                      onClick={() =>
                        updateAnswer(currentQ.id, { selectedOption: null }, true)
                      }
                      className="text-xs text-slate-400 hover:text-rose-400 transition underline pt-1 block"
                    >
                      Clear selected response
                    </button>
                  )}
                </div>
              )}

              {/* Descriptive Essay Textarea */}
              {currentQ.type === "descriptive" && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Type your detailed answer below:</span>
                    <span>
                      {(currentAns?.descriptiveAnswer || "").trim().split(/\s+/).filter(Boolean).length}{" "}
                      words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={currentAns?.descriptiveAnswer || ""}
                    onChange={(e) =>
                      updateAnswer(currentQ.id, { descriptiveAnswer: e.target.value })
                    }
                    placeholder="Provide a comprehensive answer detailing mechanisms, explanations, algorithms, or examples..."
                    className="w-full p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition leading-relaxed resize-y"
                  />
                  <p className="text-[11px] text-slate-500">
                    Your response is continuously autosaved. Evaluated manually by faculty.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-sm">
              No questions found in this assessment.
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="max-w-3xl mx-auto w-full pt-8 flex items-center justify-between gap-3 border-t border-slate-800 mt-8">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <Send className="w-4 h-4" /> Submit Exam
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right Column: Question Navigation Palette */}
        <aside className="w-full lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Question Palette</h3>
              <p className="text-[11px] text-slate-400">Click question number to navigate</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-400">{answeredCount}/{totalQuestions}</span>
              <span className="text-[10px] text-slate-500 block">Completed</span>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="grid grid-cols-4 p-2 gap-1 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-center">
            <button
              onClick={() => setPaletteFilter("all")}
              className={`py-1 rounded ${
                paletteFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({totalQuestions})
            </button>
            <button
              onClick={() => setPaletteFilter("answered")}
              className={`py-1 rounded ${
                paletteFilter === "answered" ? "bg-emerald-950 text-emerald-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Done ({answeredCount})
            </button>
            <button
              onClick={() => setPaletteFilter("unanswered")}
              className={`py-1 rounded ${
                paletteFilter === "unanswered" ? "bg-slate-800 text-slate-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Left ({unansweredCount})
            </button>
            <button
              onClick={() => setPaletteFilter("review")}
              className={`py-1 rounded ${
                paletteFilter === "review" ? "bg-purple-950 text-purple-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Marked ({markedCount})
            </button>
          </div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const a = answers[q.id];
                const isAnswered = Boolean(
                  a?.selectedOption || (a?.descriptiveAnswer && a.descriptiveAnswer.trim().length > 0)
                );
                const isMarked = Boolean(a?.isMarkedForReview);
                const isCurrent = idx === currentIndex;

                // Apply filter
                if (paletteFilter === "answered" && !isAnswered) return null;
                if (paletteFilter === "unanswered" && isAnswered) return null;
                if (paletteFilter === "review" && !isMarked) return null;

                let btnStyle = "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500";
                if (isAnswered && isMarked) {
                  btnStyle = "bg-blue-600 text-white border-blue-400 font-bold";
                } else if (isAnswered) {
                  btnStyle = "bg-emerald-600 text-white border-emerald-500 font-bold";
                } else if (isMarked) {
                  btnStyle = "bg-purple-600 text-white border-purple-400 font-bold";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl text-xs font-semibold flex items-center justify-center border transition relative ${btnStyle} ${
                      isCurrent ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105" : ""
                    }`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-purple-600 shrink-0" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-blue-600 shrink-0" />
                <span>Answered & Marked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 shrink-0" />
                <span>Not Answered</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. Anti-Cheating Warning Alert Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500 max-w-md w-full p-6 rounded-2xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Security Violation Warning</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{lastWarningMsg}</p>
            <div className="p-3 bg-slate-800 rounded-xl text-xs text-amber-300 font-semibold border border-slate-700">
              Recorded Violation Count: {tabSwitchWarnings}
            </div>
            <p className="text-[11px] text-slate-400">
              Continued tab-switching or leaving fullscreen may result in proctor disqualification.
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* 4. Submission Confirmation Dialog Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Confirm Final Submission</h3>
              <p className="text-xs text-slate-400">
                Are you ready to submit your exam answers for scoring?
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Questions:</span>
                <strong className="text-white">{totalQuestions}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">Answered Questions:</span>
                <strong className="text-emerald-400 font-bold">{answeredCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unanswered Questions:</span>
                <strong className="text-slate-300">{unansweredCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Marked for Review:</span>
                <strong className="text-purple-400 font-bold">{markedCount}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Once submitted, you will not be able to modify your answers.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
