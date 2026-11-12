"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ShieldCheck,
  User,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  GraduationCap as CapIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEnterPortal, sessionIsLive, COOKIE_BLOCKED_MESSAGE } from "@/lib/enterPortal";

export default function LoginPage() {
  const { login, quickLogin, user, loading: authLoading } = useAuth();
  const enterPortal = useEnterPortal();
  const router = useRouter();

  const [role, setRole] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !loading && !error) {
      router.replace(user.role === "admin" ? "/admin/dashboard" : "/student/dashboard");
    }
  }, [user, authLoading, loading, error, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setLoading(true);

    const res = await login(email, password, role);

    if (!res.success || !res.user) {
      setError(res.error ?? "Could not sign you in.");
      setErrorCode(res.code ?? null);
      setLoading(false);
      return;
    }

    if (!(await sessionIsLive())) {
      setError(COOKIE_BLOCKED_MESSAGE);
      setErrorCode("COOKIE_BLOCKED");
      setLoading(false);
      return;
    }

    // Full navigation so the newly set session cookie is always honoured.
    enterPortal(res.user.role === "admin" ? "admin" : "student");
  };

  const handleDemoLogin = async (targetRole: "admin" | "student") => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    const res = await quickLogin(targetRole);
    if (!res.success) {
      setError(res.error ?? "Demo sign-in failed");
      setLoading(false);
      return;
    }
    if (!(await sessionIsLive())) {
      setError(COOKIE_BLOCKED_MESSAGE);
      setErrorCode("COOKIE_BLOCKED");
      setLoading(false);
      return;
    }
    enterPortal(targetRole);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-12">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Online Java &amp; DSA Examination Portal
              </h1>
              <p className="text-xs text-slate-500">
                Department of Computer Science &amp; Engineering • Project ID: 2500030116
              </p>
            </div>

            {/* Quick Demo Logins Bar */}
            <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 space-y-2">
              <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Instant Demo Access</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("student")}
                  disabled={loading}
                  className="py-1.5 px-2.5 bg-white hover:bg-blue-100/70 border border-blue-200 rounded-lg text-xs font-semibold text-blue-800 text-left transition"
                >
                  <span className="block text-[10px] text-blue-500">Student</span>
                  Gagireddy (2500030116)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin")}
                  disabled={loading}
                  className="py-1.5 px-2.5 bg-white hover:bg-indigo-100/70 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-800 text-left transition"
                >
                  <span className="block text-[10px] text-indigo-500">Admin</span>
                  Prof. Ramreddy
                </button>
              </div>
            </div>

            {/* Lecturer demo credentials */}
            <button
              type="button"
              onClick={() => {
                setRole("student");
                setEmail("GAGIREDDYRAMREDDY@gmail.com");
                setPassword("123456");
                setError(null);
              }}
              className="w-full text-left p-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 hover:bg-blue-50 transition"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                Lecturer demo credentials — click to fill
              </div>
              <div className="font-mono text-[11px] text-slate-700 break-all">
                GAGIREDDYRAMREDDY@gmail.com / 123456
              </div>
            </button>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                  role === "student"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                  role === "admin"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Administrator
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
                {(errorCode === "NOT_FOUND" || errorCode === "EMAIL_TAKEN") && (
                  <Link
                    href="/register"
                    className="ml-6 inline-block font-semibold text-blue-700 underline hover:text-blue-900"
                  >
                    Create a free student account →
                  </Link>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === "admin" ? "admin@exam.edu" : "student@exam.edu"}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1.5 p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Passwords are hashed in the database — never stored as plain text.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {role === "admin" ? "Admin" : "Student"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
              Don&apos;t have a student account?{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                Register as Student
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
