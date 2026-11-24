export async function fetchBalance(): Promise<number | null> {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user?.tokenBalance ?? null;
  } catch {
    return null;
  }
}

export interface ChargeResult {
  ok: boolean;
  balance?: number;
  error?: string;
}

export async function chargeCredit(
  studio: string,
  format: string,
): Promise<ChargeResult> {
  try {
    const res = await fetch("/api/credits/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ studio, format }),
    });
    const data = await res.json();
    return { ok: !!data.ok, balance: data.balance, error: data.error };
  } catch {
    return { ok: false, error: "Credit charge failed" };
  }
}
