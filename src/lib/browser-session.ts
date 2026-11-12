"use client";

/**
 * Session-scoped fallback for browsers that reject third-party cookies in an
 * embedded preview. Keep the token in memory and sessionStorage (per tab),
 * never in a URL. The server still validates its signature, expiry and user
 * status for every request. An httpOnly cookie remains the primary transport.
 */
const STORAGE_KEY = "examsphere.access.v1";
let inMemoryToken: string | null = null;

export function readBrowserToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window === "undefined") return null;
  try {
    inMemoryToken = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Some sandboxed previews block web storage. In-memory SPA navigation
    // still works in that case.
  }
  return inMemoryToken;
}

export function saveBrowserToken(token: string): void {
  inMemoryToken = token;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Fall back to the in-memory copy for this tab.
  }
}

export function clearBrowserToken(): void {
  inMemoryToken = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // The in-memory copy was cleared above.
  }
}

/** Sends the fallback bearer token only to this site's own API endpoints. */
export function portalFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (typeof window !== "undefined") {
    const url = new URL(input, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) {
      throw new Error("portalFetch accepts only same-origin API requests");
    }
  } else if (!input.startsWith("/api/")) {
    throw new Error("portalFetch accepts only local API requests");
  }

  const headers = new Headers(init.headers);
  const token = readBrowserToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: init.cache ?? "no-store",
  });
}
