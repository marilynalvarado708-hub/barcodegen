import { cn } from "@/lib/utils";

/** BarcodeGen logo mark. Same artwork as src/app/icon.svg (the favicon). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="#2563eb" />
      <path
        fill="#fff"
        d="M7 8h2v16H7zm4 0h1v16h-1zm3 0h3v16h-3zm5 0h1v16h-1zm3 0h1.5v16H22zm3.5 0H27v16h-1.5z"
      />
    </svg>
  );
}
