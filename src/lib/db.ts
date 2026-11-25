import * as fs from "fs";
import * as path from "path";
import { AppError } from "@/lib/app-error";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const BALANCES_FILE = path.join(DATA_DIR, "balances.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");
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

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Serializes data-file writes so concurrent requests cannot overwrite each
// other's read-modify-write updates (file-based store is single-writer).
const writeQueue = (() => {
  let chain: Promise<unknown> = Promise.resolve();
  return <T>(op: () => T | Promise<T>): Promise<T> => {
    const result = chain.then(op);
    chain = result.catch(() => {}); // a failed op must not block later ones
    return result;
  };
})();

// Run the whole read-modify-write inside the lock. Do not call another locked
// function from inside `op` (the queue is not re-entrant); use the unlocked helpers.
async function withWriteLock<T>(op: () => T | Promise<T>): Promise<T> {
  return writeQueue(op);
}

function writeJson<T>(file: string, data: T) {
  ensureDir();
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

async function writeJsonLocked<T>(file: string, data: T): Promise<void> {
  await withWriteLock(() => writeJson(file, data));
}

export async function getUsers(): Promise<User[]> {
  return readJson<User[]>(USERS_FILE, []);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
  role: "user" | "admin" = "user"
): Promise<User> {
  return withWriteLock(() => {
  const users = readJson<User[]>(USERS_FILE, []);
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new AppError("Email already registered", 409);
  }
  const user: User = {
    id: (globalThis as any).crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36),
    email,
    passwordHash,
    name,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeJson(USERS_FILE, users);
  // Initialize token balance
  const balances = readJson<Record<string, number>>(BALANCES_FILE, {});
  balances[user.id] = 10; // welcome credits
  writeJson(BALANCES_FILE, balances);
  appendTransaction(user.id, "credit", 10, 10, "welcome");
  return user;
  });
}

export async function getBalance(userId: string): Promise<number> {
  const balances = readJson<Record<string, number>>(BALANCES_FILE, {});
  return balances[userId] ?? 0;
}

export async function setBalance(userId: string, amount: number) {
  await withWriteLock(() => {
    const balances = readJson<Record<string, number>>(BALANCES_FILE, {});
    balances[userId] = Math.max(0, amount);
    writeJson(BALANCES_FILE, balances);
  });
}

export async function adjustBalance(
  userId: string,
  delta: number,
  type: "credit" | "debit",
  reference: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  return withWriteLock(() => {
    const balances = readJson<Record<string, number>>(BALANCES_FILE, {});
    const current = balances[userId] ?? 0;
    const next = current + delta;
    if (next < 0) {
      return { ok: false, balance: current, error: "insufficient_tokens" };
    }
    balances[userId] = next;
    writeJson(BALANCES_FILE, balances);
    appendTransaction(userId, type, Math.abs(delta), next, reference);
    return { ok: true, balance: next };
  });
}

export async function recordGeneration(record: Omit<GenerationRecord, "id" | "createdAt">) {
  return withWriteLock(() => {
  const history = readJson<GenerationRecord[]>(HISTORY_FILE, []);
  const entry: GenerationRecord = {
    id: (globalThis as any).crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36),
    createdAt: new Date().toISOString(),
    ...record,
  };
  history.unshift(entry);
  writeJson(HISTORY_FILE, history);
  return entry;
  });
}

export async function getHistory(userId?: string): Promise<GenerationRecord[]> {
  const history = readJson<GenerationRecord[]>(HISTORY_FILE, []);
  return userId ? history.filter((h) => h.userId === userId) : history;
}

export async function recordTransaction(
  userId: string,
  type: "credit" | "debit",
  amount: number,
  balanceAfter: number,
  reference: string
) {
  return withWriteLock(() =>
    appendTransaction(userId, type, amount, balanceAfter, reference)
  );
}

// Unlocked: only call while holding the write lock.
function appendTransaction(
  userId: string,
  type: "credit" | "debit",
  amount: number,
  balanceAfter: number,
  reference: string
): TransactionRecord {
  const txs = readJson<TransactionRecord[]>(TRANSACTIONS_FILE, []);
  const entry: TransactionRecord = {
    id: (globalThis as any).crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36),
    userId,
    type,
    amount,
    balanceAfter,
    reference,
    createdAt: new Date().toISOString(),
  };
  txs.unshift(entry);
  writeJson(TRANSACTIONS_FILE, txs);
  return entry;
}

export async function getTransactions(userId?: string): Promise<TransactionRecord[]> {
  const txs = readJson<TransactionRecord[]>(TRANSACTIONS_FILE, []);
  return userId ? txs.filter((t) => t.userId === userId) : txs;
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase());
}
