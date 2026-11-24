"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { Copy, RefreshCw, FileText } from "lucide-react";
import { buildAamva } from "@/lib/calc/aamva";
import { JURISDICTIONS } from "@/lib/aamva-jurisdictions";
import { fetchBalance, chargeCredit } from "@/lib/credits";

const schema = z.object({
  documentType: z.enum(["DL", "ID"]),
  jurisdiction: z.string().min(1),
  iin: z.string().regex(/^\d{6}$/, "IIN must be 6 digits"),
  aamvaVersion: z.enum(["10", "11", "12"]),
  jurisdictionVersion: z.string().regex(/^\d{2}$/, "Must be 2 digits"),
  licenseNumber: z.string().min(1, "License number is required"),
  familyName: z.string().min(1, "Family name is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  nameSuffix: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  sex: z.enum(["M", "F", "X"]),
  eyeColor: z.string().optional(),
  height: z.string().optional(),
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  expirationDate: z.string().min(1, "Expiration date is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  documentDiscriminator: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  complianceType: z.enum(["M", "F", "N"]),
  vehicleClass: z.string().optional(),
  restrictions: z.string().optional(),
  endorsements: z.string().optional(),
});

export default function AamvaPage() {
  const [result, setResult] = useState<ReturnType<typeof buildAamva> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [creditError, setCreditError] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: "DL", jurisdiction: "VA", iin: "636000",
      aamvaVersion: "11", jurisdictionVersion: "01", licenseNumber: "",
      familyName: "", firstName: "", middleName: "", nameSuffix: "",
      dateOfBirth: "", sex: "M", eyeColor: "", height: "", street: "",
      street2: "", city: "", state: "VA", postalCode: "",
      expirationDate: "", issueDate: "", documentDiscriminator: "",
      country: "USA", complianceType: "F", vehicleClass: "",
      restrictions: "", endorsements: "",
    },
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
      setCreditError("Loading your account…");
      return;
    }
    if (balance < 1) {
      setCreditError("Insufficient credits to generate.");
      return;
    }
    setGenerating(true);
    setTimeout(async () => {
      setResult(
        buildAamva({
          ...data,
          middleName: data.middleName ?? "",
          nameSuffix: data.nameSuffix ?? "",
          eyeColor: data.eyeColor ?? "",
          height: data.height ?? "",
          street: data.street ?? "",
          street2: data.street2 ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          postalCode: data.postalCode ?? "",
          documentDiscriminator: data.documentDiscriminator ?? "",
          vehicleClass: data.vehicleClass ?? "",
          restrictions: data.restrictions ?? "",
          endorsements: data.endorsements ?? "",
        })
      );
      const charged = await chargeCredit("aamva", "pdf417");
      if (!charged.ok) {
        setCreditError(charged.error || "Credit charge failed");
        setResult(null);
      } else if (charged.balance != null) {
        setBalance(charged.balance);
      }
      setGenerating(false);
    }, 150);
  };
  const reset = () => { methods.reset(); setResult(null); setCreditError(""); };
  const handleCopyRaw = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.raw).catch(() => {});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AAMVA PDF417 Barcode Studio</h1>
        <p className="text-muted-foreground">
          Builds an AAMVA DL/ID PDF417 data file (Annex D structure) from simple
          input and encodes it as a real PDF417 barcode.
        </p>
      </div>

      <Alert variant="default">
        <FileText className="mr-2 h-4 w-4" />
        Synthetic test data only. Not a genuine credential, not REAL ID
        authenticated.
      </Alert>

      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Credential &amp; jurisdiction</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document type</Label>
                <select id="documentType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...methods.register("documentType")}>
                  <option value="DL">Driver License (DL)</option>
                  <option value="ID">Identification Card (ID)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Jurisdiction (state)</Label>
                <select id="jurisdiction" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...methods.register("jurisdiction")}>
                  {JURISDICTIONS.map((j) => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iin">Issuer IIN (6 digits)</Label>
                <Input id="iin" placeholder="636000" {...methods.register("iin")} />
                <p className="text-xs text-muted-foreground">AAMVA header issuer ID.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aamvaVersion">AAMVA version</Label>
                <select id="aamvaVersion" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...methods.register("aamvaVersion")}>
                  <option value="11">11 (2025)</option>
                  <option value="12">12 (2026)</option>
                  <option value="10">10 (2020)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License / ID number</Label>
                <Input id="licenseNumber" placeholder="e.g. A12345678" {...methods.register("licenseNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyName">Family name</Label>
                <Input id="familyName" placeholder="DOE" {...methods.register("familyName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="JANE" {...methods.register("firstName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle name(s)</Label>
                <Input id="middleName" placeholder="" {...methods.register("middleName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameSuffix">Suffix</Label>
                <Input id="nameSuffix" placeholder="" {...methods.register("nameSuffix")} />
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
                <Label htmlFor="expirationDate">Expiration date</Label>
                <Input id="expirationDate" type="date" {...methods.register("expirationDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue date</Label>
                <Input id="issueDate" type="date" {...methods.register("issueDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" defaultValue="USA" {...methods.register("country")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complianceType">Compliance type</Label>
                <select id="complianceType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...methods.register("complianceType")}>
                  <option value="F">Fully compliant</option>
                  <option value="M">Materially compliant</option>
                  <option value="N">Non-compliant</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-primary flex items-center justify-center gap-2"
        >
          Advanced fields (address, document discriminator, vehicle class, …)
        </button>

        {advancedOpen && (
          <Card className="mt-4">
            <CardHeader><CardTitle>Advanced fields</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentDiscriminator">Document discriminator</Label>
                  <Input id="documentDiscriminator" placeholder="" {...methods.register("documentDiscriminator")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Street 1</Label>
                  <Input id="street" placeholder="" {...methods.register("street")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street2">Street 2</Label>
                  <Input id="street2" placeholder="" {...methods.register("street2")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="" {...methods.register("city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State (DAJ)</Label>
                  <Input id="state" placeholder="" {...methods.register("state")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input id="postalCode" placeholder="" {...methods.register("postalCode")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eyeColor">Eye color</Label>
                  <Input id="eyeColor" placeholder="" {...methods.register("eyeColor")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input id="height" placeholder="" {...methods.register("height")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleClass">Vehicle class</Label>
                  <Input id="vehicleClass" placeholder="" {...methods.register("vehicleClass")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restrictions">Restrictions</Label>
                  <Input id="restrictions" placeholder="" {...methods.register("restrictions")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endorsements">Endorsements</Label>
                  <Input id="endorsements" placeholder="" {...methods.register("endorsements")} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <CardFooter className="pt-6">
          {creditError && <Alert variant="destructive">{creditError}</Alert>}
          <Button
            type="submit"
            disabled={generating || balance == null || balance < 1}
            className="w-full md:w-auto"
          >
            {generating ? "Generating…" : balance == null ? "Loading account…" : balance < 1 ? "Insufficient credits" : "Generate AAMVA data"}
          </Button>
          <Button type="button" variant="outline" onClick={reset} disabled={!result}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
          {result && (
            <Button type="button" variant="outline" onClick={handleCopyRaw}>
              <Copy className="mr-2 h-4 w-4" /> Copy AAMVA text
            </Button>
          )}
        </CardFooter>
      </form>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Encoded AAMVA text (PDF417 payload)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted p-4 rounded-lg font-mono text-xs break-all overflow-auto select-all">
              {result.raw}
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {result.fields.map((f) => (
                <div key={f.code} className="flex justify-between text-xs border-b border-border pb-1">
                  <span className="text-muted-foreground">{f.code}</span>
                  <span className="font-mono">{f.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              This text is encoded into the PDF417 barcode. Copy it or render it
              in the barcode suite.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
