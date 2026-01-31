"use client";

import { ColorChangeCards } from "../ui/color-change-card";

export default function Features() {
  return (
    <section className="py-20 md:pt-90 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950 relative overflow-hidden">
      <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-14">
        <h2 className="text-3xl lg:text-5xl lg:leading-tight tracking-tight font-light text-gray-900 dark:text-white">
          Everything you need to{" "}
          <span className="italic text-amber-600">care together</span>
        </h2>
        <p className="text-base lg:text-lg text-gray-600 dark:text-neutral-400 mt-4 max-w-2xl mx-auto font-normal leading-relaxed">
          One place for your care team: assign work, track meds, share updates,
          and stay aligned—family, caregivers, and clinicians.
        </p>
      </div>

      <ColorChangeCards className="py-8" />
    </section>
  );
}
