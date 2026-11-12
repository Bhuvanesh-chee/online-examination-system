"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearBrowserToken,
  portalFetch,
  saveBrowserToken,
} from "@/lib/browser-session";

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: "admin" | "student";
  studentId: string | null;
  department: string | null;
  avatarUrl: string | null;
}

interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
  user?: UserSession;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<AuthResult>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
    department?: string;
    phone?: string;
  }) => Promise<AuthResult>;
  quickLogin: (role: "admin" | "student") => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthResponse = {
  error?: string;
  code?: string;
  user?: UserSession;
  accessToken?: string;
};

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return {
      code: "SERVER_UNAVAILABLE",
      error: "This website address is not serving the examination API. Open the project's latest working Preview website link and try again.",
    };
  }
  try {
    return (await response.json()) as AuthResponse;
  } catch {
    return {
      code: "SERVER_UNAVAILABLE",
      error: "The server returned an incomplete response. Check /api/health on this website address and try again.",
    };
  }
}

function describeFailure(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Could not reach the server. Check your internet connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const sessionEpoch = useRef(0);

  const fetchSession = useCallback(async () => {
    const epoch = ++sessionEpoch.current;
    try {
      const res = await portalFetch("/api/auth/me");
      const data = res.ok ? await res.json() : { user: null };
      if (epoch !== sessionEpoch.current) return;
      if (data.user) {
        setUser(data.user);
      } else {
        clearBrowserToken();
        setUser(null);
      }
    } catch {
      // Don't log the student out just because a network request failed.
      // The next authenticated API call will still be verified by the server.
    } finally {
      if (epoch === sessionEpoch.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const acceptLogin = (data: AuthResponse): AuthResult => {
    if (!data.user || !data.accessToken) {
      return {
        success: false,
        code: data.code,
        error: data.error ?? "The server did not return a complete session. Please try again.",
      };
    }
    ++sessionEpoch.current;
    saveBrowserToken(data.accessToken);
    setUser(data.user);
    setLoading(false);
    return { success: true, user: data.user };
  };

  const login = async (email: string, password: string, role?: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role }),
      });
      const data = await readAuthResponse(res);
      if (!res.ok) {
        return { success: false, error: data.error ?? "Could not sign you in.", code: data.code };
      }
      return acceptLogin(data);
    } catch (err) {
      return { success: false, error: describeFailure(err) };
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
    department?: string;
    phone?: string;
  }): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...payload,
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
        }),
      });
      const data = await readAuthResponse(res);
      if (!res.ok) {
        return { success: false, error: data.error ?? "Could not create your account.", code: data.code };
      }
      return acceptLogin(data);
    } catch (err) {
      return { success: false, error: describeFailure(err) };
    }
  };

  const quickLogin = async (role: "admin" | "student"): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ role }),
      });
      const data = await readAuthResponse(res);
      if (!res.ok) {
        return { success: false, error: data.error ?? "Demo sign-in is unavailable." };
      }
      return acceptLogin(data);
    } catch (err) {
      return { success: false, error: describeFailure(err) };
    }
  };

  const logout = async () => {
    ++sessionEpoch.current;
    clearBrowserToken();
    setUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, quickLogin, logout, refreshUser: fetchSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
