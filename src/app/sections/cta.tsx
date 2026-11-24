import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-16 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-6">
          Ready to generate?
        </h2>
        <p className="text-muted-foreground mb-10 max-w-md mx-auto">
          Choose a studio and generate your first result in seconds.
        </p>
        <Button size="lg" asChild className="shadow-lg shadow-primary/25">
          <Link href="/studios">Open generation studios</Link>
        </Button>
      </div>
    </section>
  );
}
