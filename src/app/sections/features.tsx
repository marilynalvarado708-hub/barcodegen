import { CheckCheck, Layers, ShieldCheck, CreditCard } from "lucide-react";

const features = [
  {
    icon: CheckCheck,
    title: "Automatic calculations",
    description:
      "Check digits, padding, dates and encoding are handled by the platform — not by you.",
  },
  {
    icon: Layers,
    title: "Real barcode encoding",
    description:
      "Every barcode is generated with an established library and can be independently decoded.",
  },
  {
    icon: ShieldCheck,
    title: "Synthetic test data only",
    description:
      "Results are clearly identified as calculated format examples, not authentic government credentials.",
  },
  {
    icon: CreditCard,
    title: "Export & copy",
    description:
      "Transparent PNG downloads, one-click copy and form reset on every generator.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 px-4 lg:px-8 bg-muted">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Built for accuracy
        </h2>
        <p className="text-muted-foreground mb-12">
          Calculations follow published standards and results are
          independently verifiable.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
