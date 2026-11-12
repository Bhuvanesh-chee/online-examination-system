"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { portalFetch } from "@/lib/browser-session";
import {
  Sparkles,
  WandSparkles,
  Coffee,
  Network,
  PanelsTopLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Save,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  ExternalLink,
  ListChecks,
} from "lucide-react";

type Subject = "java" | "dsa" | "frontend";
type Difficulty = "easy" | "medium" | "hard";
type Mode = "auto" | "demo" | "ai";
type Source = "ai" | "demo";
type OptionId = "a" | "b" | "c" | "d";

interface Question {
  topic: string;
  difficulty: Difficulty;
  questionText: string;
  options: { id: OptionId; text: string }[];
  correctOption: OptionId;
  explanation: string;
  marks: number;
  negativeMarks: number;
}
interface Preview extends Question {
  clientId: string;
  selected: boolean;
  expanded: boolean;
  source: Source;
}
interface Configuration {
  aiConfigured: boolean;
  demoTopics: Record<Subject, string[]>;
  maxBatch: number;
}
interface SaveResult {
  savedCount: number;
  duplicateCount: number;
  bank: { id: number; name: string };
  draftExam: { id: number; title: string; code: string; status: string } | null;
}

const SUBJECT_CARDS = [
  { id: "java" as const, label: "Java Programming", subtitle: "OOP · Collections · JVM", icon: Coffee, gradient: "from-blue-600 to-indigo-600" },
  { id: "dsa" as const, label: "Data Structures & Algorithms", subtitle: "Graphs · Trees · Complexity", icon: Network, gradient: "from-violet-600 to-purple-600" },
  { id: "frontend" as const, label: "Frontend Development", subtitle: "HTML · CSS · React", icon: PanelsTopLeft, gradient: "from-teal-600 to-emerald-600" },
];

const DIFFICULTY_OPTIONS = [
  { id: "easy" as const, label: "Easy", description: "Recall & basics", active: "bg-emerald-600 text-white border-emerald-600" },
  { id: "medium" as const, label: "Medium", description: "Apply concepts", active: "bg-amber-500 text-white border-amber-500" },
  { id: "hard" as const, label: "Hard", description: "Deep reasoning", active: "bg-rose-600 text-white border-rose-600" },
];

const SAMPLE_PRESETS: { subject: Subject; topic: string; difficulty: Difficulty; caption: string }[] = [
  { subject: "java", topic: "OOP", difficulty: "medium", caption: "Java · OOP" },
  { subject: "dsa", topic: "Graphs", difficulty: "hard", caption: "DSA · Graphs" },
  { subject: "frontend", topic: "React", difficulty: "medium", caption: "Frontend · React" },
];

export default function QuestionStudioPage() {
  const [config, setConfig] = useState<Configuration | null>(null);
  const [configError, setConfigError] = useState("");
  const [subject, setSubject] = useState<Subject>("java");
  const [topic, setTopic] = useState("Mixed topics");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState<Mode>("auto");
  const [stage, setStage] = useState<Preview[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [createDraft, setCreateDraft] = useState(false);
  const [draftTitle, setDraftTitle] = useState("Java Programming — Generated Practice Exam");

  useEffect(() => {
    let active = true;
    portalFetch("/api/admin/generator")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load generator settings");
        if (active) setConfig(data);
      })
      .catch((error: unknown) => {
        if (active) setConfigError(error instanceof Error ? error.message : "Unable to load generator settings");
      });
    return () => { active = false; };
  }, []);

  const selectedCount = stage.filter((question) => question.selected).length;
  const availableTopics = config?.demoTopics[subject] ?? [];
  const subjectLabel = SUBJECT_CARDS.find((card) => card.id === subject)?.label ?? "Programming";

  function switchSubject(next: Subject) {
    if (next === subject) return;
    if (stage.length > 0 && !window.confirm("Changing subject will clear unsaved previews. Continue?")) return;
    setSubject(next);
    setTopic("Mixed topics");
    setCount(5);
    setStage([]);
    setSaveResult(null);
    setNotice(null);
    setDraftTitle(`${SUBJECT_CARDS.find((card) => card.id === next)?.label} — Generated Practice Exam`);
  }

  function chooseTopic(next: string) {
    setTopic(next);
    setCount(next === "Mixed topics" ? 5 : 1);
    setNotice(null);
  }

  async function generate(overrides?: { subject: Subject; topic: string; difficulty: Difficulty; count: number; replace?: boolean }) {
    const chosenSubject = overrides?.subject ?? subject;
    const chosenTopic = overrides?.topic ?? topic;
    const chosenDifficulty = overrides?.difficulty ?? difficulty;
    const slots = overrides?.replace ? 8 : 8 - stage.length;
    if (slots < 1) {
      setNotice({ type: "error", text: "Your workspace holds up to 8 questions. Save or clear some before generating more." });
      return;
    }
    setGenerating(true);
    setNotice(null);
    setSaveResult(null);
    try {
      const requested = Math.min(overrides?.count ?? count, slots);
      const response = await portalFetch("/api/admin/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: chosenSubject, topic: chosenTopic.trim(), difficulty: chosenDifficulty, count: requested, mode }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (Array.isArray(data.suggestedTopics)) {
          throw new Error(`${data.error} Try: ${data.suggestedTopics.slice(0, 4).join(", ")}.`);
        }
        throw new Error(data.error || "Question generation failed");
      }
      const incoming: Preview[] = (data.questions as Question[]).map((question) => ({
        ...question,
        clientId: crypto.randomUUID(),
        source: data.source as Source,
        selected: true,
        expanded: false,
      }));
      const existing = overrides?.replace ? [] : stage;
      const seen = new Set(existing.map((q) => q.questionText.toLowerCase()));
      const unique = incoming.filter((q) => {
        const key = q.questionText.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (unique.length === 0) {
        setNotice({ type: "info", text: "That sample is already in your workspace. Try another difficulty or topic for a different question." });
      } else {
        setStage([...existing, ...unique].slice(0, 8));
        setNotice({ type: "info", text: `${unique.length} ${data.source === "ai" ? "AI-generated" : "offline demo"} question${unique.length === 1 ? "" : "s"} ready. ${data.notice}` });
      }
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    } finally {
      setGenerating(false);
    }
  }

  async function applyPreset(preset: (typeof SAMPLE_PRESETS)[number]) {
    if (preset.subject !== subject && stage.length > 0 && !window.confirm("Switch subject and clear unsaved previews?")) return;
    const replace = preset.subject !== subject;
    setSubject(preset.subject);
    setTopic(preset.topic);
    setDifficulty(preset.difficulty);
    setCount(1);
    if (replace) setStage([]);
    setDraftTitle(`${SUBJECT_CARDS.find((card) => card.id === preset.subject)?.label} — Generated Practice Exam`);
    await generate({ ...preset, count: 1, replace });
  }

  function updatePreview(clientId: string, changes: Partial<Preview>) {
    setStage((previous) => previous.map((question) => question.clientId === clientId ? { ...question, ...changes } : question));
  }

  function updateOption(clientId: string, optionId: OptionId, text: string) {
    setStage((previous) => previous.map((question) => question.clientId !== clientId ? question : {
      ...question,
      options: question.options.map((option) => option.id === optionId ? { ...option, text } : option),
    }));
  }

  async function saveSelected() {
    const selected = stage.filter((question) => question.selected);
    if (!selected.length) {
      setNotice({ type: "error", text: "Select at least one question to save." });
      return;
    }
    if (createDraft && draftTitle.trim().length < 5) {
      setNotice({ type: "error", text: "Enter a draft exam title of at least 5 characters." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const response = await portalFetch("/api/admin/generator/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          createDraft,
          draftTitle: draftTitle.trim(),
          questions: selected.map(({ topic, difficulty, questionText, options, correctOption, explanation, marks, negativeMarks }) => ({
            topic, difficulty, questionText, options, correctOption, explanation, marks, negativeMarks,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save questions");
      setSaveResult(data);
      setNotice({ type: "success", text: `${data.savedCount} new question${data.savedCount === 1 ? "" : "s"} saved to ${data.bank.name}.${data.duplicateCount ? ` ${data.duplicateCount} already existed and were reused.` : ""}${data.draftExam ? " A draft exam was created for faculty review." : ""}` });
      setStage((previous) => previous.filter((question) => !question.selected));
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save questions" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-900 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-200">
              <Sparkles className="h-3.5 w-3.5" /> ExamSphere innovation lab
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">AI Question Studio</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Turn a subject, topic and difficulty into exam-ready MCQs. Preview the answer key, edit every detail, then save to a question bank or build a draft exam in one workflow.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-blue-100">
              <span className="rounded-full bg-white/10 px-3 py-1">Java</span>
              <span className="rounded-full bg-white/10 px-3 py-1">DSA</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Frontend</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Instructor review first</span>
            </div>
          </div>
          <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:w-64">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Generator mode</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-bold">
              <span className={`h-2.5 w-2.5 rounded-full ${config?.aiConfigured ? "bg-emerald-400" : "bg-amber-400"}`} />
              {config ? (config.aiConfigured ? "Live AI available" : "Offline demo available") : "Checking capabilities…"}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
              {config?.aiConfigured ? "Powered by your server-side AI key. Offline examples remain available." : "No API key required for sample questions. Add OPENAI_API_KEY to enable new AI-generated variations."}
            </p>
          </div>
        </div>
      </section>

      {configError && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" /> {configError}
        </div>
      )}

      {/* Presets */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><Lightbulb className="h-4 w-4 text-amber-500" /> One-click samples for your lecturer</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLE_PRESETS.map((preset) => (
            <button key={preset.caption} type="button" onClick={() => applyPreset(preset)} disabled={generating || !config}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50">
              <span><span className="block text-xs font-bold text-slate-800">{preset.caption}</span><span className="mt-0.5 block text-[11px] capitalize text-slate-500">{preset.difficulty} question · 4 options</span></span>
              <ArrowRight className="h-4 w-4 text-blue-500 transition group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Configuration */}
        <section className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <WandSparkles className="h-5 w-5 text-blue-600" />
            <div><h2 className="text-base font-bold text-slate-900">Build your questions</h2><p className="text-xs text-slate-500">Choose what your students should know</p></div>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">1. Examination subject</label>
              <div className="space-y-2">
                {SUBJECT_CARDS.map((card) => {
                  const Icon = card.icon;
                  return <button type="button" key={card.id} onClick={() => switchSubject(card.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${subject === card.id ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 hover:bg-slate-50"}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${card.gradient} text-white`}><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-900">{card.label}</p><p className="text-[11px] text-slate-500">{card.subtitle}</p></div>
                    {subject === card.id && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </button>;
                })}
              </div>
            </div>

            <div>
              <label htmlFor="generator-topic" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">2. Topic or chapter</label>
              <input id="generator-topic" value={topic} onChange={(event) => { setTopic(event.target.value); if (event.target.value !== "Mixed topics") setCount(1); }}
                placeholder="e.g. Inheritance, Graphs, React Hooks" maxLength={80}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <p className="mt-1 text-[11px] text-slate-500">Pick a suggestion or type your own topic for live AI.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button onClick={() => chooseTopic("Mixed topics")} type="button" className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${topic === "Mixed topics" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Mixed topics</button>
                {availableTopics.map((value) => <button key={value} onClick={() => chooseTopic(value)} type="button" className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${topic === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{value}</button>)}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">3. Difficulty level</span>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button key={option.id} type="button" onClick={() => setDifficulty(option.id)}
                    className={`rounded-xl border p-2 text-center transition ${difficulty === option.id ? option.active : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
                    <span className="block text-xs font-bold">{option.label}</span><span className={`mt-0.5 block text-[10px] ${difficulty === option.id ? "text-white/80" : "text-slate-400"}`}>{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="generator-count" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Questions</label>
                <select id="generator-count" value={count} onChange={(event) => setCount(Number(event.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                  {[1, 3, 5, 8].map((n) => <option key={n} value={n}>{n} {n === 1 ? "question" : "questions"}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="generator-mode" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Generation mode</label>
                <select id="generator-mode" value={mode} onChange={(event) => setMode(event.target.value as Mode)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                  <option value="auto">Auto</option><option value="demo">Offline demo</option>
                  {config?.aiConfigured && <option value="ai">Real AI only</option>}
                </select>
              </div>
            </div>

            <button type="button" onClick={() => generate()} disabled={generating || !config || !topic.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Questions <ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-slate-500">{topic === "Mixed topics" ? "Mixed packs include multiple chapters at your selected difficulty." : "Offline mode has one vetted sample per specific topic and difficulty. Live AI can create more."}</p>
          </div>
        </section>

        {/* Workspace */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><ListChecks className="h-5 w-5 text-indigo-600" /> Review workspace <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{stage.length}/8</span></h2><p className="mt-0.5 text-xs text-slate-500">Only selected and reviewed questions will be saved.</p></div>
              {stage.length > 0 && <div className="flex items-center gap-2"><button type="button" onClick={() => setStage((previous) => previous.map((q) => ({ ...q, selected: true })))} className="text-xs font-semibold text-blue-600 hover:underline">Select all</button><span className="text-slate-300">·</span><button type="button" onClick={() => { setStage([]); setNotice(null); }} className="text-xs font-semibold text-rose-600 hover:underline">Clear workspace</button></div>}
            </div>
          </div>

          {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-4 text-xs leading-relaxed ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
            {notice.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : notice.type === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}{notice.text}
          </div>}

          {saveResult && <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-800">What’s next?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={`/admin/questions?bankId=${saveResult.bank.id}`} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"><BookOpenCheck className="h-3.5 w-3.5" /> View saved bank</Link>
              {saveResult.draftExam && <Link href={`/admin/exams/${saveResult.draftExam.id}/edit`} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><ExternalLink className="h-3.5 w-3.5" /> Review draft exam</Link>}
            </div>
          </div>}

          {stage.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><WandSparkles className="h-7 w-7" /></div>
              <h3 className="text-base font-bold text-slate-900">Ready to make exam questions?</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">Pick Java, DSA or Frontend, enter a topic and choose Easy, Medium or Hard. Generate one question or a 5-question mixed-topic sample pack.</p>
            </div>
          ) : stage.map((question, index) => (
            <article key={question.clientId} className={`rounded-2xl border bg-white shadow-sm transition ${question.selected ? "border-indigo-200 ring-1 ring-indigo-50" : "border-slate-200 opacity-75"}`}>
              <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:p-5">
                <input aria-label={`Select question ${index + 1}`} type="checkbox" checked={question.selected} onChange={(event) => updatePreview(question.clientId, { selected: event.target.checked })} className="mt-1 h-4 w-4 accent-blue-600" />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold"><span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">Q{index + 1}</span><span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">{question.topic}</span><span className="rounded bg-amber-50 px-2 py-0.5 capitalize text-amber-700">{question.difficulty}</span><span className={`rounded px-2 py-0.5 ${question.source === "ai" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"}`}>{question.source === "ai" ? "Real AI" : "Offline demo"}</span></div>
                  <p className="text-sm font-semibold leading-relaxed text-slate-900">{question.questionText}</p>
                </div>
                <button type="button" onClick={() => setStage((previous) => previous.filter((q) => q.clientId !== question.clientId))} aria-label={`Remove question ${index + 1}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
                {question.options.map((option) => <div key={option.id} className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${option.id === question.correctOption ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold uppercase ${option.id === question.correctOption ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>{option.id}</span><span className="min-w-0 flex-1 break-words">{option.text}</span>{option.id === question.correctOption && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}</div>)}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 sm:px-5"><span className="text-[11px] text-slate-500"><strong className="text-emerald-700">Correct: {question.correctOption.toUpperCase()}</strong> · {question.marks} mark{question.marks === 1 ? "" : "s"} · {question.explanation}</span><button type="button" onClick={() => updatePreview(question.clientId, { expanded: !question.expanded })} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">{question.expanded ? "Hide editor" : "Edit & review"}{question.expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button></div>
              {question.expanded && <div className="space-y-4 border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                <div><label className="mb-1 block text-xs font-bold text-slate-700">Question text</label><textarea value={question.questionText} onChange={(event) => updatePreview(question.clientId, { questionText: event.target.value })} rows={2} className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" /></div>
                <div className="grid gap-3 sm:grid-cols-2">{question.options.map((option) => <div key={option.id}><label className="mb-1 block text-xs font-semibold text-slate-700">Option {option.id.toUpperCase()}</label><div className="flex items-center gap-2"><input type="radio" name={`correct-${question.clientId}`} aria-label={`Set option ${option.id.toUpperCase()} as correct`} checked={question.correctOption === option.id} onChange={() => updatePreview(question.clientId, { correctOption: option.id })} className="h-4 w-4 accent-emerald-600" /><input value={option.text} onChange={(event) => updateOption(question.clientId, option.id, event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs outline-none focus:ring-2 focus:ring-blue-100" /></div></div>)}</div>
                <div><label className="mb-1 block text-xs font-bold text-slate-700">Answer explanation</label><textarea value={question.explanation} onChange={(event) => updatePreview(question.clientId, { explanation: event.target.value })} rows={2} className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" /></div>
                <div className="flex flex-wrap gap-3"><label className="text-xs font-bold text-slate-700">Marks <input type="number" min={1} max={20} step={0.5} value={question.marks} onChange={(event) => updatePreview(question.clientId, { marks: Number(event.target.value) })} className="ml-1 w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs" /></label><label className="text-xs font-bold text-slate-700">Negative marks <input type="number" min={0} max={question.marks} step={0.5} value={question.negativeMarks} onChange={(event) => updatePreview(question.clientId, { negativeMarks: Number(event.target.value) })} className="ml-1 w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs" /></label></div>
              </div>}
            </article>
          ))}

          {stage.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Instructor review is required: verify the correct option, explanation and difficulty before saving. New questions never change your existing 15-question published exams automatically.</span></div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" checked={createDraft} onChange={(event) => setCreateDraft(event.target.checked)} className="h-4 w-4 accent-indigo-600" />Also create a draft exam from selected questions</label>
            {createDraft && <div className="mt-3"><label htmlFor="draft-title" className="mb-1 block text-xs font-semibold text-slate-700">Draft exam title</label><input id="draft-title" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} maxLength={120} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100" /><p className="mt-1 text-[11px] text-slate-500">Drafts are hidden from students. Review in Examination Management, then publish when ready.</p></div>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{selectedCount} selected · {subjectLabel} bank</span><button type="button" onClick={saveSelected} disabled={saving || selectedCount === 0} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> {createDraft ? "Save & create draft" : "Save selected to bank"}</>}</button></div>
          </div>}
        </section>
      </div>
    </div>
  );
}
