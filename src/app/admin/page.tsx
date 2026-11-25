"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait until AuthProvider has finished loading the session before redirecting.
    if (!loading && !user) router.push("/login?callbackUrl=/admin");
  }, [loading, user, router]);

  if (loading || !user) return null;

  if (user.role !== "admin") {
    return (
      <div className="px-4 py-12 lg:px-8 max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold mb-2">Access denied</h1>
        <p className="mb-6 text-muted-foreground">
          The admin area is restricted to administrator accounts.
        </p>
        <Link href="/studios" className="text-primary hover:underline">
          Back to studios
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 lg:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-3">Administration</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as <strong>{user.email}</strong> (role:{" "}
          <span className="capitalize">{user.role}</span>).
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Admin-only controls go here. This is a placeholder admin area.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/studios">Open studios</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
