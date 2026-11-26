import { NextResponse } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function configuredOrigins(): string[] {
  const raw = [process.env.APP_ORIGIN, process.env.APP_ORIGINS]
    .filter(Boolean)
    .join(",");
  return raw
    .split(",")
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));
}

function isLocalOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (url.protocol === "http:" || url.protocol === "https:") && LOCAL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function requestIsLocal(request: Request): boolean {
  try {
    return isLocalOrigin(new URL(request.url).origin);
  } catch {
    return false;
  }
}

/**
 * Blocks cross-site state-changing requests. Deployments should set APP_ORIGIN
 * (or a comma-separated APP_ORIGINS list). Local development and local
 * production builds remain convenient, but untrusted production origins fail
 * closed. X-Forwarded-Host is deliberately ignored.
 */
export function isSameOriginRequest(request: Request): boolean {
  const allowed = configuredOrigins();
  const candidate = request.headers.get("origin") || request.headers.get("referer");
  const isProduction = process.env.NODE_ENV === "production";

  if (!candidate) {
    return !isProduction || requestIsLocal(request);
  }

  const candidateOrigin = normalizeOrigin(candidate);
  if (!candidateOrigin) return false;

  if (allowed.length > 0) {
    return allowed.includes(candidateOrigin);
  }

  if (!isProduction) {
    try {
      return isLocalOrigin(candidateOrigin) || candidateOrigin === new URL(request.url).origin;
    } catch {
      return false;
    }
  }

  return isLocalOrigin(candidateOrigin) && requestIsLocal(request);
}

export function originGuard(request: Request): NextResponse | null {
  if (isSameOriginRequest(request)) return null;
  return NextResponse.json(
    { error: "Request blocked: cross-origin request rejected.", code: "BAD_ORIGIN" },
    { status: 403 }
  );
}
