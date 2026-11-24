"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Barcode,
  IdCard,
  BookUser,
  QrCode,
  User,
  LogOut,
  LogIn,
  Shield,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const studios = [
  { name: "AAMVA PDF417", href: "/studios/aamva", icon: IdCard },
  { name: "UK Field 5", href: "/studios/uk-field5", icon: BookUser },
  { name: "ICAO MRZ", href: "/studios/mrz", icon: QrCode },
  { name: "Barcode Suite", href: "/studios/barcode", icon: Barcode },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = React.useState(false);

  if (loading) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-backdrop">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs tracking-tighter">
            BC
          </div>
          <span className="font-bold text-xl tracking-tight">BarcodeGen</span>
        </Link>

        <div className="hidden lg:flex items-center gap-4">
          {studios.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              className="text-sm font-medium text-foreground transition hover:text-primary"
            >
              <s.icon className="h-4 w-4 mr-1.5" /> {s.name}
            </Link>
          ))}
          {user?.role === "admin" && (
            <a
              href="/admin"
              className="text-xs font-medium text-muted-foreground hidden md:block hover:text-primary"
            >
              Admin
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {user.email} •
              </span>
              <Badge inline variant="outline" size="sm">
                {user.role}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => logout()} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}
        </div>

        <button
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">Open menu</span>
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background p-4 animate-fade-in">
          <div className="space-y-2">
            {studios.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm rounded-lg hover:bg-accent"
              >
                <s.icon className="h-4 w-4 mr-2" /> {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function Badge({
  inline,
  variant,
  size,
  children,
}: {
  inline?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold border-transparent ${
        variant === "outline" ? "border-input text-muted-foreground" : ""
      }`}
    >
      {children}
    </span>
  );
}
