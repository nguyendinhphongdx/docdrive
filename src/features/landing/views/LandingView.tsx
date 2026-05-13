import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { CTA } from "../components/CTA";
import { Nav } from "../components/Nav";

export function LandingView() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
