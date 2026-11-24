"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border border-input",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant ?? "default"],
        className
      )}
      {...props}
    />
  );
}
Badge.displayName = "Badge";

export function Separator({
  className,
  ...props
}: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn(
        "relative box-content -mx-px my-1.5 h-[1px]",
        className
      )}
      {...props}
    />
  );
}
Separator.displayName = "Separator";

export function Alert({
  variant = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive" | "success" | "warning";
}) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    success: "bg-green-50 border-green-200 text-green-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border p-4 text-sm",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
Alert.displayName = "Alert";
