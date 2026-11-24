import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative bg-primary text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1600')] opacity-40" />
      <div className="relative px-4 py-16 lg:px-8 lg:py-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-foreground/80 text-xs font-semibold mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
            <span className="relative inline-flex h-full w-full rounded-full opacity-20 bg-primary-foreground"></span>
          </span>
          Automatic generation
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-balance tracking-tight mb-6">
          Provide the information.<br />
          The system does the rest.
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl leading-relaxed">
          Select a studio, complete a simple form and click Generate. The platform
          automatically performs every calculation, encodes the data and renders
          the result — no technical barcode knowledge required.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/studios">Open generation studios</Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/studios/mrz">Try ICAO MRZ Studio</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
