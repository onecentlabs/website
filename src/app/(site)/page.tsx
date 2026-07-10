import { Hero } from "@/components/sections/Hero";
import { KpiStrip } from "@/components/sections/KpiStrip";
import { Pillars } from "@/components/sections/Pillars";
import { Flow } from "@/components/sections/Flow";
import { Cta } from "@/components/sections/Cta";

export default function Home() {
  return (
    <>
      <Hero />
      <KpiStrip />
      <Pillars />
      <Flow />
      <Cta />
    </>
  );
}
