"use client";

import Link from "next/link";
import { LogoMark } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="px-4 py-8 lg:px-6 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <LogoMark className="h-6 w-6" />
            BarcodeGen
          </Link>
          <p className="text-xs">
            Synthetic test-data generation for development and education only.
            Not a government-issued credential service.
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/privacy" className="hover:text-foreground transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition">
              Terms
            </Link>
            <Link href="/studios" className="hover:text-foreground transition">
              Studios
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
