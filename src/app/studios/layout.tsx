"use client";

import Link from "next/link";
import * as React from "react";
import { IdCard, BookUser, QrCode, Barcode, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const studios = [
  { name: "AAMVA PDF417", href: "/studios/aamva", icon: IdCard },
  { name: "UK Field 5", href: "/studios/uk-field5", icon: BookUser },
  { name: "ICAO MRZ", href: "/studios/mrz", icon: QrCode },
  { name: "Barcode Suite", href: "/studios/barcode", icon: Barcode },
];

export default function StudiosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Desktop only: on mobile the top navbar menu already lists the studios.
          Sticks just below the 61px top navbar. */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:self-start lg:sticky lg:top-[61px] lg:h-[calc(100vh-61px)] shrink-0 border-r border-border bg-card transition-[width] duration-200 ${
          collapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <div className="flex h-12 items-center justify-between px-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">BC</div>
            {!collapsed && <span className="font-bold text-sm">BarcodeGen</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12l6 6M5 12l6-6" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
            )}
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-1">
            {studios.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition hover:bg-accent"
              >
                <s.icon className="h-4 w-4 shrink-0" />
                {!collapsed && s.name}
              </Link>
            ))}
          </div>
        </nav>
        <div className="p-3 border-t border-border">
          {user ? (
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Sign out"}
            </button>
          ) : (
            <Link href="/login" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              {!collapsed && "Sign in"}
            </Link>
          )}
        </div>
      </aside>
      <div className="flex-1 min-w-0 bg-background/50">
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
