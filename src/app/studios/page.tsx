import Link from "next/link";
import { IdCard, BookUser, QrCode, Barcode, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";

const studios = [
  {
    name: "AAMVA PDF417 Barcode Studio",
    href: "/studios/aamva",
    icon: IdCard,
    description:
      "Standards-based AAMVA DL/ID PDF417 data formatting and barcode generation for synthetic testing and software development.",
    formats: "PDF417 • US/CA jurisdictions • DL & ID cards",
    status: "1 credit",
  },
  {
    name: "UK Driving Licence Field 5 Calculator",
    href: "/studios/uk-field5",
    icon: BookUser,
    description:
      "Automatic Field 5 (driver number) calculation for GB DVLA photocard licences from surname, DOB, gender and initials.",
    formats: "Field 5 • Surname padding • DOB • Gender months",
    status: "Free",
  },
  {
    name: "ICAO Doc 9303 MRZ Studio",
    href: "/studios/mrz",
    icon: QrCode,
    description:
      "Machine Readable Zone generation for TD1, TD2, TD3, MRV-A and MRV-B with automatic check digits and line formatting.",
    formats: "TD1 • TD2 • TD3 • MRV-A • MRV-B",
    status: "Free",
  },
  {
    name: "1D / 2D Barcode Suite",
    href: "/studios/barcode",
    icon: Barcode,
    description:
      "Generate QR Code, PDF417, Data Matrix, Aztec, Code 128, Code 39, EAN-13 and UPC-A barcodes with validation and export.",
    formats: "QR • PDF417 • Data Matrix • Aztec • Code 128 • Code 39 • EAN-13 • UPC-A",
    status: "Free",
  },
];

export default function StudiosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generation studios</h1>
        <p className="text-muted-foreground mt-2">
          Select a studio. Each one performs real calculations from simple input
          — you never enter check digits or encoding strings yourself.
        </p>
      </div>

      <Alert variant="default">
        All generators produce synthetic test data and format examples only.
        Results are not authentic government-issued credentials and do not
        confer any official status.
      </Alert>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {studios.map((s) => (
          <Card key={s.name} className="hover:shadow-md transition-shadow group">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-3">
                <s.icon className="h-5 w-5 text-primary" />
                <BadgeInline variant="outline" size="sm">
                  {s.status}
                </BadgeInline>
              </div>
              <CardTitle className="text-lg">{s.name}</CardTitle>
            </CardHeader>
            <CardDescription className="mb-4 text-sm">{s.description}</CardDescription>
            <CardFooter>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.formats}</span>
                <Link
                  href={s.href}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open studio &rarr;
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-3">How it works</h2>
        <ol className="list-disc list-inside text-sm text-muted-foreground space-y-2">
          <li>
            Choose a studio and the format or document type you need.
          </li>
          <li>
            Fill in the simple form — names, dates, IDs, or the data to encode.
          </li>
          <li>
            Click Generate. The platform calculates check digits, padding, dates
            and encoding automatically.
          </li>
          <li>
            Preview the result, then copy or download it.
          </li>
        </ol>
      </div>
    </div>
  );
}

function BadgeInline({
  variant,
  size,
  children,
}: {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent ${
        variant === "outline" ? "border-input text-muted-foreground" : ""
      }`}
    >
      {children}
    </span>
  );
}
