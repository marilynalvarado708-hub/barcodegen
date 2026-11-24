import Link from "next/link";
import { IdCard, BookUser, QrCode, Barcode } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const studios = [
  {
    title: "AAMVA PDF417 Barcode Studio",
    description:
      "Standards-based AAMVA DL/ID PDF417 data formatting and barcode generation for synthetic testing and software development.",
    icon: IdCard,
    formats: "PDF417 • US jurisdictions • DL/ID cards",
    href: "/studios/aamva",
  },
  {
    title: "UK Driving Licence Field 5 Calculator",
    description:
      "Automatic Field 5 calculation for GB DVLA photocard driving licences. Enter personal information; the system formats the result.",
    icon: BookUser,
    formats: "Field 5 • Surname padding • DOB • Gender months",
    href: "/studios/uk-field5",
  },
  {
    title: "ICAO Doc 9303 MRZ Studio",
    description:
      "Machine Readable Zone generation for TD1, TD2, TD3, MRV-A and MRV-B with automatic check digits and line formatting.",
    icon: QrCode,
    formats: "TD1 • TD2 • TD3 • MRV-A • MRV-B",
    href: "/studios/mrz",
  },
  {
    title: "1D / 2D Barcode Suite",
    description:
      "Generate QR Code, PDF417, Data Matrix, Aztec, Code 128, Code 39, EAN-13 and UPC-A barcodes with validation and export.",
    icon: Barcode,
    formats: "QR • PDF417 • Data Matrix • Aztec • Code 128 • Code 39 • EAN-13 • UPC-A",
    href: "/studios/barcode",
  },
];

export function StudiosSection() {
  return (
    <section className="py-16 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Generation studios
        </h2>
        <p className="text-muted-foreground mb-12">
          Four independent engines. Each performs real, standards-based
          calculations from simple user input.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {studios.map((s) => (
            <Card key={s.title} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-3">
                  <s.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Studio
                  </span>
                </div>
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardDescription className="mb-4 text-sm">
                {s.description}
              </CardDescription>
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
      </div>
    </section>
  );
}
