import { AppError } from "@/lib/app-error";
import { supabaseAdmin } from "@/lib/supabase";

// Data store: Supabase Postgres. Tables and functions are defined in
// supabase/schema.sql. All access is server-side with the service_role key.

const WELCOME_CREDITS = 10;

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface GenerationRecord {
  id: string;
  userId: string | null;
  studio: string;
  format: string;
  tokens: number;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  reference: string;
  createdAt: string;
}

// ---- row mapping (Postgres snake_case <-> app camelCase) ----

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: "user" | "admin";
  created_at: string;
}

const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  passwordHash: r.password_hash,
  name: r.name,
  role: r.role,
  createdAt: r.created_at,
});

const toGeneration = (r: any): GenerationRecord => ({
  id: r.id,
  userId: r.user_id,
  studio: r.studio,
  format: r.format,
  tokens: r.tokens,
  createdAt: r.created_at,
  ip: r.ip ?? undefined,
  userAgent: r.user_agent ?? undefined,
});

const toTransaction = (r: any): TransactionRecord => ({
  id: r.id,
  userId: r.user_id,
  type: r.type,
  amount: r.amount,
  balanceAfter: r.balance_after,
  reference: r.reference,
  createdAt: r.created_at,
});

function fail(context: string, error: { message: string; code?: string }): never {
  // Logged server-side by handleError; the client only sees a generic message.
  throw new Error(`[db:${context}] ${error.code ?? ""} ${error.message}`);
}

// ---- users ----

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) fail("getUsers", error);
  return (data as UserRow[]).map(toUser);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("getUserById", error);
  return data ? toUser(data as UserRow) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  // Emails are stored lower-cased, so an exact match is case-insensitive.
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) fail("getUserByEmail", error);
  return data ? toUser(data as UserRow) : undefined;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
  role: "user" | "admin" = "user"
): Promise<User> {
  const { data, error } = await supabaseAdmin().rpc("create_user", {
    p_email: email.trim().toLowerCase(),
    p_password_hash: passwordHash,
    p_name: name,
    p_role: role,
    p_welcome: WELCOME_CREDITS,
  });
  if (error) {
    if (error.code === "23505") throw new AppError("Email already registered", 409);
    fail("createUser", error);
  }
  return toUser(data as UserRow);
}

// ---- balances ----

export async function getBalance(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin()
    .from("balances")
    .select("amount")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) fail("getBalance", error);
  return data?.amount ?? 0;
}

export async function setBalance(userId: string, amount: number) {
  const { error } = await supabaseAdmin()
    .from("balances")
    .upsert({ user_id: userId, amount: Math.max(0, Math.floor(amount)) });
  if (error) fail("setBalance", error);
}

export async function adjustBalance(
  userId: string,
  delta: number,
  type: "credit" | "debit",
  reference: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  // Atomic in Postgres: row lock, no negative balance, transaction recorded.
  const { data, error } = await supabaseAdmin().rpc("adjust_balance", {
    p_user_id: userId,
    p_delta: Math.trunc(delta),
    p_type: type,
    p_reference: reference,
  });
  if (error) fail("adjustBalance", error);
  const row = (Array.isArray(data) ? data[0] : data) as { ok: boolean; balance: number };
  return row.ok
    ? { ok: true, balance: row.balance }
    : { ok: false, balance: row.balance, error: "insufficient_tokens" };
}

// ---- history ----

export async function recordGeneration(record: Omit<GenerationRecord, "id" | "createdAt">) {
  const { data, error } = await supabaseAdmin()
    .from("generations")
    .insert({
      user_id: record.userId,
      studio: record.studio,
      format: record.format,
      tokens: record.tokens,
      ip: record.ip ?? null,
      user_agent: record.userAgent ?? null,
    })
    .select()
    .single();
  if (error) fail("recordGeneration", error);
  return toGeneration(data);
}

export async function getHistory(userId?: string): Promise<GenerationRecord[]> {
  let q = supabaseAdmin().from("generations").select("*").order("created_at", { ascending: false });
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) fail("getHistory", error);
  return (data ?? []).map(toGeneration);
}

// ---- transactions ----

export async function recordTransaction(
  userId: string,
  type: "credit" | "debit",
  amount: number,
  balanceAfter: number,
  reference: string
) {
  const { data, error } = await supabaseAdmin()
    .from("transactions")
    .insert({ user_id: userId, type, amount, balance_after: balanceAfter, reference })
    .select()
    .single();
  if (error) fail("recordTransaction", error);
  return toTransaction(data);
}

export async function getTransactions(userId?: string): Promise<TransactionRecord[]> {
  let q = supabaseAdmin().from("transactions").select("*").order("created_at", { ascending: false });
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) fail("getTransactions", error);
  return (data ?? []).map(toTransaction);
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}
