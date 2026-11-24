import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set a strong random value in .env (see .env.example). " +
      "Do not use a default secret in production.",
  );
}
const JWT_EXPIRES_IN = "7d";
const AUTH_COOKIE = "auth_token";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: { id: string; email: string; name: string; role: string }): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || "",
      role: (decoded.role as "user" | "admin") || "user",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(AUTH_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function parseAuthCookieFromReq(
  headers: { get: (name: string) => string | null }
): SessionUser | null {
  try {
    const header = headers.get("cookie") || "";
    const parsed = cookie.parse(header);
    const token = parsed[AUTH_COOKIE];
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
