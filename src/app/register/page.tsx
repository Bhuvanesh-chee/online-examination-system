"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Lock,
  Mail,
  BookOpen,
  Phone,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { portalPath } from "@/lib/enterPortal";

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("B.Tech Computer Science and Engineering");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const [serviceMessage, setServiceMessage] = useState("");
  const [statusCheck, setStatusCheck] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("This website address is not serving the current examination backend. Open the latest Preview website link.");
        }
        const data = await response.json();
        if (!active) return;
        if (response.ok && data.ok) {
          setServiceStatus("ready");
          setServiceMessage("");
        } else {
          setServiceStatus("unavailable");
          setServiceMessage(data.error || "The registration database is unavailable on this deployment.");
        }
      })
      .catch((issue: unknown) => {
        if (!active) return;
        setServiceStatus("unavailable");
        setServiceMessage(
          issue instanceof Error && issue.name !== "AbortError"
            ? issue.message
            : "This website could not reach its backend. Check that you opened the latest Preview website URL."
        );
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [statusCheck]);

  // A signed-in visitor has no reason to see the sign-up form.
  useEffect(() => {
    if (!authLoading && user && !loading && !error) {
      router.replace(portalPath(user.role));
    }
  }, [user, authLoading, loading, error, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setLoading(true);

    const studentEmailPattern = /^\d{10}@kluniversity\.in$/i;
    if (!studentEmailPattern.test(email.trim())) {
      setError("Please register using your official KL University student email ID (example: 2500030116@kluniversity.in).");
      setLoading(false);
      return;
    }

    const result = await register({ name, email, password, studentId, department, phone });

    if (!result.success) {
      setError(result.error ?? "Registration failed. Please try again.");
      setErrorCode(result.code ?? null);
      setLoading(false);
      return;
    }

    // Registration creates a pending account; sign-in is granted only after
    // an administrator approves it.
    setDone(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-12">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#A12D33] flex items-center justify-center text-white mx-auto shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Request Student Account</h1>
              <p className="text-xs text-slate-500">
                Submit your details — an administrator must approve the account before you can sign in.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center text-xs text-blue-900">
              Already registered with this email?{" "}
              <Link href="/login" className="font-bold text-blue-700 underline underline-offset-2 hover:text-blue-900">
                Sign in instead — your account and results are saved.
              </Link>
            </div>

            {serviceStatus === "checking" && (
              <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking the registration server…
              </div>
            )}
            {serviceStatus === "ready" && (
              <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> Registration server and database are ready.
              </div>
            )}
            {serviceStatus === "unavailable" && (
              <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
                <p className="font-bold">This website cannot register students right now</p>
                <p className="mt-1 leading-relaxed">{serviceMessage}</p>
                <div className="mt-3 flex flex-wrap gap-3 font-semibold">
                  <button type="button" onClick={() => { setServiceStatus("checking"); setStatusCheck((value) => value + 1); }} className="text-blue-700 underline hover:text-blue-900">
                    Check again
                  </button>
                  <a href="/api/health" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">
                    View server status
                  </a>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
                {errorCode === "EMAIL_TAKEN" && (
                  <Link
                    href="/login"
                    className="ml-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-700"
                  >
                    Sign In to Your Existing Account <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}

            {done && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Registration submitted.</span>
                </div>
                <p>
                  Your account is pending administrator approval. You will be able to sign in
                  once it has been approved.
                </p>
                <Link href="/login" className="inline-block font-semibold text-[#A12D33] underline">
                  Go to sign in →
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gagireddy Ramreddy"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="studentId" className="block text-xs font-semibold text-slate-700 mb-1">
                    Student ID / Roll No
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 2500030116"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="department" className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / Major
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="B.Tech Computer Science and Engineering"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Official KL University Student Email ID *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="2500030116@kluniversity.in"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: 10-digit roll number followed by @kluniversity.in (e.g. 2500030116@kluniversity.in)
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Password * (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {password.length > 0 && password.length < 6
                    ? `${6 - password.length} more character(s) needed`
                    : "Use at least 6 characters."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || done}
                className="w-full py-2.5 px-4 rounded-xl bg-[#A12D33] hover:bg-[#7d1f24] disabled:bg-[#c98b8f] text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting your request...</span>
                  </>
                ) : done ? (
                  <span>Request Submitted</span>
                ) : (
                  <>
                    <span>Submit Registration Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
