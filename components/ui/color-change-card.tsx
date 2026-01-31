"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Coco-themed data: caregiving focus, warm tone, elder-friendly copy. heightClass for masonry.
const COCO_CARDS = [
  {
    heading: "Plan",
    description:
      "Create a care plan with tasks and routines. Assign who does what and see when things are done—so nothing falls through the cracks. Set due dates and priorities so the whole team knows what matters most.",
    imgSrc:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=85",
    heightClass: "min-h-[380px] md:min-h-[420px]",
  },
  {
    heading: "Routines",
    description:
      "Track daily habits and medications in one place. Gentle reminders keep everyone on schedule and support consistency. Log completions and see at a glance how the week is going.",
    imgSrc:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85",
    heightClass: "min-h-[320px] md:min-h-[360px]",
  },
  {
    heading: "Connect",
    description:
      "Keep family, caregivers, and clinicians on the same page. Share updates and observations so everyone stays informed. Notes from doctor visits, mood changes, and daily highlights live in one shared place.",
    imgSrc:
      "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=85",
    heightClass: "min-h-[360px] md:min-h-[400px]",
  },
  {
    heading: "Support",
    description:
      "One place for your whole care team. Coordinate easily and give your loved one consistent, thoughtful care. Family, paid caregivers, and doctors all see the same information—no confusion, no missed details.",
    imgSrc:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=85",
    heightClass: "min-h-[400px] md:min-h-[440px]",
  },
];

export interface ColorChangeCardItem {
  heading: string;
  description: string;
  imgSrc: string;
  /** Optional: e.g. "min-h-[360px]" for masonry height variance */
  heightClass?: string;
}

interface ColorChangeCardsProps {
  /** Override default Coco cards. Use for custom landing or dashboard sections. */
  cards?: ColorChangeCardItem[];
  /** Optional class for the grid container */
  className?: string;
}

const appearVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

/**
 * Color-change cards with image hover (scale) and letter animation.
 * Masonry layout, larger images, warm overlay. Uses Coco theme.
 */
export function ColorChangeCards({
  cards = COCO_CARDS,
  className,
}: ColorChangeCardsProps) {
  return (
    <div className={cn("p-4 py-12 md:p-8", className)}>
      <div
        className="mx-auto w-full max-w-6xl columns-1 gap-5 md:columns-2 md:gap-6 lg:gap-8"
        style={{ columnFill: "balance" }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.heading}
            className="break-inside-avoid mb-5 md:mb-6 lg:mb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={appearVariants}
            custom={index}
          >
            <ColorChangeCard
              heading={card.heading}
              description={card.description}
              imgSrc={card.imgSrc}
              heightClass={card.heightClass}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Card Component (Coco theme: amber overlay, larger image) ---
interface ColorChangeCardProps {
  heading: string;
  description: string;
  imgSrc: string;
  heightClass?: string;
}

function ColorChangeCard({
  heading,
  description,
  imgSrc,
  heightClass = "min-h-[360px] md:min-h-[400px]",
}: ColorChangeCardProps) {
  return (
    <motion.div
      transition={{ staggerChildren: 0.035 }}
      whileHover="hover"
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-xl bg-slate-200 dark:bg-neutral-800",
        heightClass
      )}
    >
      <div
        className="absolute inset-0 rounded-xl transition-transform duration-500 group-hover:scale-110"
        style={{
          backgroundImage: `url(${imgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Warm overlay (no B&W): amber/stone gradient, slightly lighter on hover so text stays readable */}
      <div
        className="absolute inset-0 z-10 rounded-xl bg-gradient-to-t from-amber-950/85 via-amber-900/50 to-amber-800/20 transition-all duration-500 group-hover:from-amber-950/70 group-hover:via-amber-900/40 group-hover:to-amber-800/15"
        aria-hidden
      />
      <div className="relative z-20 flex h-full flex-col justify-between p-4 text-amber-100 transition-colors duration-500 group-hover:text-white dark:text-amber-100 dark:group-hover:text-white">
        <ArrowRight className="ml-auto size-7 shrink-0 transition-transform duration-500 group-hover:-rotate-45" />
        <div>
          <h4 className="font-semibold tracking-tight">
            {heading.split("").map((letter, index) => (
              <AnimatedLetter letter={letter} key={index} />
            ))}
          </h4>
          <p className="mt-1 text-sm leading-relaxed opacity-95">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// --- AnimatedLetter (staggered letter hover) ---
const letterVariants: Variants = {
  hover: {
    y: "-50%",
  },
};

interface AnimatedLetterProps {
  letter: string;
}

function AnimatedLetter({ letter }: AnimatedLetterProps) {
  return (
    <div className="inline-block h-9 overflow-hidden font-semibold text-2xl md:text-3xl">
      <motion.span
        className="flex min-w-[4px] flex-col"
        style={{ y: "0%" }}
        variants={letterVariants}
        transition={{ duration: 0.5 }}
      >
        <span>{letter}</span>
        <span>{letter}</span>
      </motion.span>
    </div>
  );
}

export default ColorChangeCards;
