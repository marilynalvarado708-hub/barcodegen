"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { Copy, RefreshCw, FileText } from "lucide-react";
import { generateMRZ, type MrzFormat } from "@/lib/calc/mrz";

const schema = z.object({
  format: z.enum(["TD1", "TD2", "TD3", "MRVA", "MRVB"]),
  issuingState: z.string().min(1, "Issuing state is required").max(3),
  surname: z.string().min(1, "Surname is required"),
  givenNames: z.string().min(1, "Given names is required"),
  documentNumber: z.string().min(1, "Document number is required"),
  nationality: z.string().min(1, "Nationality is required").max(3),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  sex: z.enum(["M", "F", "X"]),
  expiryDate: z.string().min(1, "Expiry date is required"),
  personalNumber: z.string().optional(),
  optional: z.string().optional(),
  optional2: z.string().optional(),
});

const FORMAT_LABELS: Record<MrzFormat, string> = {
  TD1: "TD1 — ID card (3 lines × 30)",
  TD2: "TD2 — ID card (2 lines × 36)",
  TD3: "TD3 — Passport (2 lines × 44)",
 
  MRVA: "MRV-A — Visa (2 lines × 44)",
  MRVB: "MRV-B — Visa (2 lines × 36)",
};

export default function MrzPage() {
  const [result, setResult] = useState<ReturnType<typeof generateMRZ> | null>(null);
  const [generating, setGenerating] = useState(false);
  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      format: "TD3",
      issuingState: "USA",
      surname: "",
      givenNames: "",
      documentNumber: "",
      nationality: "USA",
      dateOfBirth: "",
      sex: "M",
      expiryDate: "",
      personalNumber: "",
      optional: "",
      optional2: "",
    },
  });
  const format = methods.watch("format");

  // MRZ is free: no sign-in or credits needed.
  const onSubmit = (data: z.infer<typeof schema>) => {
    setGenerating(true);
    setTimeout(() => {
      setResult(generateMRZ(data));
      setGenerating(false);
    }, 150);
  };

  const reset = () => {
    methods.reset();
    setResult(null);
  };

  const handleCopy = () => {
    if (!result) return;
    const mrz = [result.line1, result.line2, result.line3].filter(Boolean).join("\n");
    navigator.clipboard.writeText(mrz).catch(() => {});
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ICAO Doc 9303 MRZ Studio</h1>
        <p className="text-muted-foreground">
          Generates Machine Readable Zone lines for TD1, TD2, TD3, MRV-A and
          MRV-B. Check digits, filler characters and line formatting are
          calculated automatically.
        </p>
      </div>

      <Alert variant="default">
        <FileText className="mr-2 h-4 w-4" />
        Format calculation only. A structurally valid MRZ is not proof that a
        passport, visa or identity document is genuine or officially issued.
      </Alert>

      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Document type &amp; issuing state</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Document type</Label>
                <select id="format" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...methods.register("format")}>
                  {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                    <option key={k} value={k as MrzFormat}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuingState">Issuing state (3 chars)</Label>
                <Input id="issuingState" maxLength={3} placeholder="USA" {...methods.register("issuingState")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality (3 chars)</Label>
                <Input id="nationality" maxLength={3} placeholder="USA" {...methods.register("nationality")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Holder details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surname">Surname / primary identifier</Label>
                <Input id="surname" placeholder="DOE" {...methods.register("surname")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="givenNames">Given names / secondary identifier</Label>
                <Input id="givenNames" placeholder="JANE" {...methods.register("givenNames")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Document number</Label>
                <Input id="documentNumber" placeholder="123456789" {...methods.register("documentNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of birth</Label>
                <Input id="dateOfBirth" type="date" {...methods.register("dateOfBirth")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <select id="sex" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...methods.register("sex")}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="X">Unspecified</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry date</Label>
                <Input id="expiryDate" type="date" {...methods.register("expiryDate")} />
              </div>
              {format === "TD3" || format === "MRVA" ? (
                <div className="space-y-2">
                  <Label htmlFor="personalNumber">Personal number / optional (14 chars)</Label>
                  <Input id="personalNumber" maxLength={14} placeholder="" {...methods.register("personalNumber")} />
                </div>
              ) : null}
              {format === "TD1" || format === "TD2" || format === "MRVB" ? (
                <div className="space-y-2">
                  <Label htmlFor="optional">Optional data</Label>
                  <Input id="optional" placeholder="" {...methods.register("optional")} />
                </div>
              ) : null}
              {format === "TD1" ? (
                <div className="space-y-2">
                  <Label htmlFor="optional2">Optional 2 (TD1 only)</Label>
                  <Input id="optional2" placeholder="" {...methods.register("optional2")} />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <CardFooter className="pt-6">
          <Button
            type="submit"
            disabled={generating}
            className="w-full md:w-auto"
          >
            {generating ? "Generating…" : "Generate MRZ"}
          </Button>
          <Button type="button" variant="outline" onClick={reset} disabled={!result}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
          {result && (
            <Button type="button" variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" /> Copy MRZ
            </Button>
          )}
        </CardFooter>
      </form>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generated MRZ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre break-all select-all">
              {[result.line1, result.line2, result.line3].filter(Boolean).join("\n")}
            </div>
            <div className="grid md:grid-cols-3 gap-2 text-xs">
              <div className="border-b border-border pb-1">
                <span className="text-muted-foreground block">Line 1 length</span>
                <span className="font-mono">{result.fieldLengths.line1}</span>
              </div>
              <div className="border-b border-border pb-1">
                <span className="text-muted-foreground block">Line 2 length</span>
                <span className="font-mono">{result.fieldLengths.line2}</span>
              </div>
              {result.line3 && (
                <div className="border-b border-border pb-1">
                  <span className="text-muted-foreground block">Line 3 length</span>
                  <span className="font-mono">{result.fieldLengths.line3}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Copy the MRZ above. Line lengths are shown for verification.
            </p>
          </CardContent>
          <CardFooter>
            <Alert variant="default">
              A structurally valid MRZ is a format calculation only — it is not
              proof that a passport, visa or ID document is genuine.
            </Alert>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
