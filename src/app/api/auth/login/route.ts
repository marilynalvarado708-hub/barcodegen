import { NextResponse } from "next/server";
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import { AppError, handleError } from "@/lib/app-error";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const AUTH_RATE = { limit: 5, windowMs: 15 * 60 * 1000 }; // 5 attempts per 15 min

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const limit = rateLimit(`auth:login:${ip}`, AUTH_RATE);
    if (!limit.allowed) {
      throw new AppError("Too many attempts. Try again later.", 429);
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      throw new AppError("Email and password are required");
    }
    const user = await getUserByEmail(email);
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new AppError("Invalid email or password", 401);
    }
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
    return handleError(e, "auth/login");
  }
}