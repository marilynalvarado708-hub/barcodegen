"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (mounted) setUser((data as any)?.user ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // POST JSON and never throw: a network failure or a non-JSON error page
  // (e.g. a crashed serverless function) becomes a normal error message.
  const postJson = async (url: string, body: unknown): Promise<any> => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };

  const login = async (email: string, password: string) => {
    const data = await postJson("/api/auth/login", { email, password });
    if (data.user) {
      setUser(data.user);
      router.refresh();
    }
    return { ok: data.ok, error: data.error };
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await postJson("/api/auth/register", { email, password, name });
    if (data.user) {
      setUser(data.user);
      router.refresh();
    }
    return { ok: data.ok, error: data.error };
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
    router.refresh();
  };

  const isAdmin = () => user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
