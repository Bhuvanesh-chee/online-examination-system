"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  useEnterPortal,
  sessionIsLive,
  COOKIE_BLOCKED_MESSAGE,
  portalPath,
  type PortalRole,
} from "@/lib/enterPortal";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const enterPortal = useEnterPortal();
  const router = useRouter();

  const [role, setRole] = useState<PortalRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

    enterPortal(res.user.role);
  };

  const roles: { value: PortalRole; label: string; icon: typeof GraduationCap }[] = [
    { value: "student", label: "Student", icon: GraduationCap },
    { value: "teacher", label: "Teacher", icon: BookOpen },
    { value: "admin", label: "Admin", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[#A12D33] flex items-center justify-center text-white mx-auto shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">KL University Portal</h1>
              <p className="text-xs text-slate-500">
                Sign in with your approved examination credentials.
              </p>
            </div>

            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {roles.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    role === value
                      ? "bg-white text-[#A12D33] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
                {(errorCode === "PENDING_APPROVAL" || errorCode === "ACCOUNT_REJECTED") && (
                  <p className="ml-6 text-slate-600">
                    Contact your examination administrator if you believe this is an error.
                  </p>
                )}
                {(errorCode === "INVALID_CREDENTIALS" || errorCode === "BAD_PASSWORD") && (
                  <Link
                    href="/register"
                    className="ml-6 inline-block font-semibold text-[#A12D33] underline hover:text-[#7d1f24]"
                  >
                    Need a student account? Register here →
                  </Link>
                )}
              </div>
            )}

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
                    placeholder="you@kluniversity.in"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A12D33] focus:border-transparent transition"
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
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A12D33] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1.5 p-1.5 rounded-md text-slate-400 hover:text-[#A12D33] hover:bg-slate-100 transition"
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
                className="w-full py-2.5 px-4 rounded-xl bg-[#A12D33] hover:bg-[#7d1f24] disabled:opacity-70 text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
              New student?{" "}
              <Link href="/register" className="font-semibold text-[#A12D33] hover:underline">
                Request an account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
