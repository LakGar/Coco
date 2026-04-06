import type { Metadata } from "next";
import State from "@/components/about/state";
import Team from "@/components/about/team";
import Mission from "@/components/about/mission";
import Footer from "@/components/landing/footer";
import Nav from "@/components/landing/nav";
import VideoStatsSection from "@/components/landing/video-stats-section";
import Hero from "@/components/about/hero";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet the team behind Coco and learn about the mission to make caregiving feel more connected, steady, and human.",
};

const About = () => {
  return (
    <div className="w-screen flex flex-col justify-center items-center z-10 relative bg-primary-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <Mission />

      <VideoStatsSection />
      <State />
      <Team />
      <Footer />
    </div>
  );
};

export default About;
