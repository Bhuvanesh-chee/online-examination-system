import { cookies, headers } from "next/headers";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "oes_session_token";
const COOKIE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_LIFETIME_MS = 12 * 60 * 60 * 1000;
const DEV_FALLBACK_SECRET = "development-only-insecure-secret-change-me";
let warnedAboutSecret = false;

/** Production must configure AUTH_SECRET. Development gets a warning-only fallback. */
function signingSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set to at least 32 characters in production");
  }

  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn(
      secret
        ? "AUTH_SECRET is shorter than 32 characters; using it for development only."
        : "AUTH_SECRET is not set; using an insecure development-only fallback."
    );
  }

  return secret || DEV_FALLBACK_SECRET;
}

export type UserRole = "admin" | "student" | "teacher";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  studentId: string | null;
  department: string | null;
  avatarUrl: string | null;
  approvalStatus: ApprovalStatus;
}

/** Central authorization gate used by every protected API and page. */
export function isAuthorizedUser(user: {
  role: string;
  isActive: boolean;
  approvalStatus: string;
}): boolean {
  if (!user.isActive) return false;
  if (user.role === "admin") return true;
  return user.approvalStatus === "approved" && (user.role === "student" || user.role === "teacher");
}

type SessionPayload = {
  userId: number;
  purpose: "cookie" | "access";
  iat: number;
  exp: number;
};

function signToken(userId: number, purpose: SessionPayload["purpose"], lifetimeMs: number): string {
  const now = Date.now();
  const data: SessionPayload = { userId, purpose, iat: now, exp: now + lifetimeMs };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", signingSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

/** For the embedded-preview fallback; do not put this token in URLs or logs. */
export function issueAccessToken(userId: number): string {
  return signToken(userId, "access", ACCESS_LIFETIME_MS);
}

function verifyToken(token: string, purpose: SessionPayload["purpose"]): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const [encoded, signature] = parts;
    const expected = crypto
      .createHmac("sha256", signingSecret())
      .update(encoded)
      .digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as Partial<SessionPayload>;
    if (
      !Number.isSafeInteger(decoded.userId) ||
      !Number.isSafeInteger(decoded.exp) ||
      decoded.purpose !== purpose ||
      !decoded.exp ||
      decoded.exp <= Date.now()
    ) {
      return null;
    }
    return decoded as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Authorization is looked up in Next's request context so existing route
 * handlers keep using getSessionUser() without taking a client-supplied id.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const requestHeaders = await headers();
    const bearer = requestHeaders.get("authorization");
    const accessToken = bearer?.startsWith("Bearer ") ? bearer.slice(7).trim() : null;
    const fromAccess = accessToken ? verifyToken(accessToken, "access") : null;

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const fromCookie = cookieToken ? verifyToken(cookieToken, "cookie") : null;

    const userId = fromAccess?.userId ?? fromCookie?.userId;
    if (!userId) return null;

    const { db } = await import("@/db");
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        studentId: users.studentId,
        department: users.department,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        approvalStatus: users.approvalStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !isAuthorizedUser(user)) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      studentId: user.studentId,
      department: user.department,
      avatarUrl: user.avatarUrl,
      approvalStatus: user.approvalStatus as ApprovalStatus,
    };
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}

/** Returns the session user only when their role is in the allowed list. */
export async function requireRole(roles: UserRole[]): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

function sessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    // Browsers with strict third-party-cookie blocking still need the
    // session-scoped bearer fallback provided on login.
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  };
}

export async function setSessionCookie(userId: number): Promise<void> {
  const token = signToken(userId, "cookie", COOKIE_LIFETIME_MS);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...sessionCookieOptions(),
    maxAge: COOKIE_LIFETIME_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}
