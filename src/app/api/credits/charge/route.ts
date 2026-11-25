import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adjustBalance, recordGeneration } from "@/lib/db";
import { AppError, handleError } from "@/lib/app-error";

export const dynamic = "force-dynamic";

const CREDIT_COST = 1;

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) throw new AppError("Unauthorized", 401);

    // The cost is fixed on the server; never trust an amount sent by the client.
    const amount = CREDIT_COST;
    const body = (await req.json().catch(() => ({}))) ?? {};
    const str = (v: unknown, max: number) =>
      typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
    const reference = str(body.reference, 64);
    const studio = str(body.studio, 32);
    const format = str(body.format, 64);

    const charged = await adjustBalance(
      user.id,
      -amount,
      "debit",
      reference || "generation",
    );
    if (!charged.ok) {
      if (charged.error === "insufficient_tokens") {
        throw new AppError("Insufficient credits", 402);
      }
      throw new AppError(charged.error || "Credit charge failed", 400);
    }

    await recordGeneration({
      userId: user.id,
      studio: studio ?? "unknown",
      format: format ?? "unknown",
      tokens: -amount,
    });

    return NextResponse.json({ ok: true, balance: charged.balance });
  } catch (e: any) {
    return handleError(e, "credits/charge");
  }
}
