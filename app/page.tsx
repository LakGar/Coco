import type { Metadata } from "next";
import Nav from "@/components/landing/nav";
import Hero from "@/components/landing/hero";
import Feature from "../components/landing/feature";
import VideoStatsSection from "@/components/landing/video-stats-section";
import Philosophy from "@/components/landing/philosophy";
import Pricing from "@/components/landing/pricing";
import Faq from "@/components/landing/faq";
import Footer from "@/components/landing/footer";
import AllFeatures from "@/components/landing/all-features";

export const metadata: Metadata = {
  title: "Support for Caregivers and Families",
  description:
    "Coco gives caregivers a calmer way to coordinate routines, share updates, and stay supported together.",
};

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <main className="relative z-10">
        <div className="bg-background rounded-t-3xl">
          <Feature />
          <Philosophy />
          <VideoStatsSection />
          <AllFeatures />

          <Pricing />
          <Faq />
          <Footer />
        </div>
      </main>
    </>
  );
}
