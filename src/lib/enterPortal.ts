"use client";

import { useRouter } from "next/navigation";
import { portalFetch } from "@/lib/browser-session";

export type PortalRole = "admin" | "student";

export function portalPath(role: PortalRole): string {
  return role === "admin" ? "/admin/dashboard" : "/student/dashboard";
}

/** Verify either the normal cookie or the tab-scoped fallback token. */
export async function sessionIsLive(): Promise<boolean> {
  try {
    const res = await portalFetch("/api/auth/me");
    if (!res.ok) return false;
    const data = (await res.json()) as { user?: unknown };
    return Boolean(data.user);
  } catch {
    return false;
  }
}

/** Client navigation keeps the AuthProvider mounted, even without cookies. */
export function useEnterPortal(): (role: PortalRole) => void {
  const router = useRouter();
  return (role) => router.replace(portalPath(role));
}

export const COOKIE_BLOCKED_MESSAGE =
  "Your session could not be verified. Please retry, or open the website in its own browser tab.";
