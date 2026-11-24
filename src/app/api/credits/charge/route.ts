import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  adjustBalance,
  getBalance,
  recordGeneration,
  recordTransaction,
} from "@/lib/db";
import { AppError, handleError } from "@/lib/app-error";

export const dynamic = "force-dynamic";

const CREDIT_COST = 1;

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) throw new AppError("Unauthorized", 401);

    const { amount = CREDIT_COST, reference, studio, format } =
      (await req.json()) ?? {};

    const balance = await getBalance(user.id);
    if (balance < amount) {
      throw new AppError("Insufficient credits", 402);
    }

    const charged = await adjustBalance(
      user.id,
      -amount,
      "debit",
      reference || "generation",
    );
    if (!charged.ok) {
      throw new AppError(charged.error || "Credit charge failed", 400);
    }

    await recordGeneration({
      userId: user.id,
      studio: studio ?? "unknown",
      format: format ?? "unknown",
      tokens: -amount,
    });
    await recordTransaction(
      user.id,
      "debit",
      amount,
      charged.balance,
      reference || "generation",
    );

    return NextResponse.json({ ok: true, balance: charged.balance });
  } catch (e: any) {
    return handleError(e, "credits/charge");
  }
}
