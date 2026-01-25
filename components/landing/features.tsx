"use client";
import { motion } from "framer-motion";
import {
  Heart,
  Users,
  Calendar,
  FileText,
  Bell,
  BarChart3,
} from "lucide-react";
import { FeaturesSectionWithBentoGrid } from "../blocks/feature-section-with-bento-grid";

const features = [
  {
    icon: Heart,
    title: "Care Team Coordination",
    description:
      "Seamlessly coordinate with family members, caregivers, and healthcare providers in one unified platform.",
    gradient: "from-rose-400/20 via-pink-400/20 to-rose-500/20",
    iconGradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Community Support",
    description:
      "Connect with other caregivers, share experiences, and find support in our compassionate community.",
    gradient: "from-blue-400/20 via-cyan-400/20 to-blue-500/20",
    iconGradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Calendar,
    title: "Routine Management",
    description:
      "Track daily routines, medications, and appointments with intelligent scheduling and reminders.",
    gradient: "from-amber-400/20 via-orange-400/20 to-amber-500/20",
    iconGradient: "from-amber-500 to-orange-500",
  },
  {
    icon: FileText,
    title: "Care Notes",
    description:
      "Document important observations, medical updates, and care insights in organized, searchable notes.",
    gradient: "from-purple-400/20 via-indigo-400/20 to-purple-500/20",
    iconGradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Stay informed with intelligent notifications that keep your care team aligned and aware.",
    gradient: "from-green-400/20 via-emerald-400/20 to-green-500/20",
    iconGradient: "from-green-500 to-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Care Insights",
    description:
      "Understand patterns and trends in care with visual analytics and caregiver burden tracking.",
    gradient: "from-violet-400/20 via-purple-400/20 to-violet-500/20",
    iconGradient: "from-violet-500 to-purple-500",
  },
];

export default function Features() {
  return (
    <section className="py-20 md:pt-100 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden min-h-screen">
      <FeaturesSectionWithBentoGrid />
    </section>
  );
}
