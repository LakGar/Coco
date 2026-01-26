import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import Community from "@/components/landing/community";
import AppShowcase from "@/components/landing/app-showcase";
import HowItWorks from "@/components/landing/how-it-works";
import Testimonials from "@/components/landing/testimonials";
import CTA from "@/components/landing/cta";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Hero />
      <Features />
      <Community />
      <AppShowcase />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
