import { NextResponse } from "next/server";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { createUser, isAdminEmail } from "@/lib/db";
import { AppError, handleError } from "@/lib/app-error";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MIN_PASSWORD_LENGTH = 8;
const AUTH_RATE = { limit: 5, windowMs: 15 * 60 * 1000 }; // 5 attempts per 15 min

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const limit = rateLimit(`auth:register:${ip}`, AUTH_RATE);
    if (!limit.allowed) {
      throw new AppError("Too many attempts. Try again later.", 429);
    }

    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      throw new AppError("Email, password and name are required");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }
    const passwordHash = await hashPassword(password);
    const role = isAdminEmail(email) ? "admin" : "user";
    const user = await createUser(email, passwordHash, name, role);

    // Log the user in immediately so they are not logged out after registering.
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e: any) {
    return handleError(e, "auth/register");
  }
}