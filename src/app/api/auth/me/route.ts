import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBalance } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      ...user,
      tokenBalance: await getBalance(user.id),
    },
  });
}
