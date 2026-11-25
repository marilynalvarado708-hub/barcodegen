"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { Copy, RefreshCw, FileText } from "lucide-react";
import { calculateUkField5 } from "@/lib/calc/uk-field5";
import { fetchBalance, chargeCredit } from "@/lib/credits";

const schema = z.object({
  surname: z.string().min(1, "Surname is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["M", "F"]),
});

export default function UkField5Page() {
  const [result, setResult] = useState<ReturnType<typeof calculateUkField5> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [creditError, setCreditError] = useState("");
  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { surname: "", firstName: "", middleName: "", dateOfBirth: "", gender: "M" },
  });

  useEffect(() => {
    let mounted = true;
    fetchBalance().then((b) => {
      if (mounted) {
        setBalance(b);
        setBalanceLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setCreditError("");
    if (balanceLoading || balance == null) {
      setCreditError(balanceLoading ? "Loading your account…" : "Please sign in to use this studio.");
      return;
    }
    if (balance < 1) {
      setCreditError("Insufficient credits to generate.");
      return;
    }
    setGenerating(true);
    setTimeout(async () => {
      setResult(calculateUkField5(data));
      const charged = await chargeCredit("uk-field5", "field5");
      if (!charged.ok) {
        setCreditError(charged.error || "Credit charge failed");
        setResult(null);
      } else if (charged.balance != null) {
        setBalance(charged.balance);
      }
      setGenerating(false);
    }, 150);
  };

  const reset = () => {
    methods.reset();
    setResult(null);
    setCreditError("");
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.field5).catch(() => {});
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">UK Field 5 Calculator</h1>
        <p className="text-muted-foreground">
          Calculates the Field 5 (driver number) of a Great Britain DVLA
          photocard driving licence from personal details. The system handles
          surname padding, date-of-birth components and the gender month
          adjustment automatically.
        </p>
      </div>

      {creditError && <Alert variant="destructive">{creditError}</Alert>}
      {balanceLoading && <p className="text-sm text-muted-foreground">Loading your account…</p>}

      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Enter personal details</CardTitle>
            <CardDescription>Only the information needed for the calculation is requested.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input id="surname" placeholder="e.g. Morgan" {...methods.register("surname")} />
                {methods.formState.errors.surname && (
                  <p className="text-xs text-destructive">{methods.formState.errors.surname.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="e.g. John" {...methods.register("firstName")} />
                {methods.formState.errors.firstName && (
                  <p className="text-xs text-destructive">{methods.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle name (optional)</Label>
                <Input id="middleName" placeholder="e.g. Willi" {...methods.register("middleName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of birth</Label>
                <Input id="dateOfBirth" type="date" {...methods.register("dateOfBirth")} />
                {methods.formState.errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{methods.formState.errors.dateOfBirth.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select id="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...methods.register("gender")}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                {methods.formState.errors.gender && (
                  <p className="text-xs text-destructive">{methods.formState.errors.gender.message}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={generating || balance == null || balance < 1}>
              {generating ? (
                <>Calculating…</>
              ) : balance == null ? (
                balanceLoading ? "Loading account…" : "Sign in to generate"
              ) : balance < 1 ? (
                "Insufficient credits"
              ) : (
                "Generate Field 5"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={reset} disabled={!result}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </CardFooter>
        </Card>
      </form>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Field 5 value</CardTitle>
            <CardDescription>
              Positions 1-14 are calculated from your input. Positions 15-16 are
              the DVLA&rsquo;s unpublished check characters and are shown as
              placeholders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted/50 border border-border rounded-lg p-4 font-mono text-lg select-all break-all text-foreground">
                {result.field5}
              </div>
              <Button onClick={handleCopy} disabled={!result.valid}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
            {!result.valid && (
              <Alert variant="destructive">
                {result.errors.join(". ")}. Please correct the input above.
              </Alert>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-muted-foreground font-semibold">Field</th>
                    <th className="pb-2 text-muted-foreground font-semibold text-right">Positions</th>
                    <th className="pb-2 text-muted-foreground font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.breakdown.map((f) => (
                    <tr key={f.positions}>
                      <td className="py-2">{f.label}</td>
                      <td className="py-2 text-right font-mono">{f.positions}</td>
                      <td className="py-2 font-mono">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter>
            <Alert variant="default">
              <FileText className="mr-2 h-4 w-4" />
              This is a <strong>calculated format example</strong>, not a genuine
              DVLA-issued driver number and not proof of a valid licence. The DVLA
              check-character algorithm (positions 15-16) is not published.
            </Alert>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}