import { HeroSection } from "./sections/hero";
import { StudiosSection } from "./sections/studios";
import { FeaturesSection } from "./sections/features";
import { CtaSection } from "./sections/cta";

export default function HomePage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <StudiosSection />
      <FeaturesSection />
      <CtaSection />
    </div>
  );
}
