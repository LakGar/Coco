"use client";
import { motion } from "framer-motion";
import { TestimonialsColumn } from "../blocks/testimonials-columns-1";

const testimonials = [
  {
    text: "COCO has transformed how our family cares for my mother. The community support has been incredible, and having everyone on the same page has reduced so much stress.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Sarah Chen",
    role: "Daughter & Primary Caregiver",
  },
  {
    text: "The care team features are a game-changer. We can coordinate schedules, share updates, and everyone stays informed. It's like having a command center for care.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Michael Rodriguez",
    role: "Son & Care Coordinator",
  },
  {
    text: "Finding the community on COCO was a lifeline. Connecting with others who understand this journey has been invaluable. I don't feel alone anymore.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Emily Thompson",
    role: "Spouse & Caregiver",
  },
  {
    text: "The routine tracking and insights have helped us identify patterns we never noticed. COCO truly helps you find what works best for your loved one.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "David Kim",
    role: "Family Caregiver",
  },
  {
    text: "The caregiver burden tracking feature helped me realize I needed to take better care of myself. The insights are gentle but eye-opening.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Jennifer Martinez",
    role: "Primary Caregiver",
  },
  {
    text: "Being able to share notes and updates with my siblings who live far away has brought our family closer together. We're all on the same page now.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Lisa Anderson",
    role: "Daughter & Care Coordinator",
  },
  {
    text: "The community forums have been a source of comfort and practical advice. It's amazing how much support you can find when you need it most.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Robert Taylor",
    role: "Spouse & Caregiver",
  },
  {
    text: "The smart notifications keep me informed without being overwhelming. I know when something important happens, but I'm not constantly checking my phone.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Patricia Wilson",
    role: "Family Caregiver",
  },
  {
    text: "COCO has made caregiving feel less isolating. The combination of family coordination and community support is exactly what we needed.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "James Brown",
    role: "Son & Primary Caregiver",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export default function Testimonials() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background blur elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-rose-100/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
            Stories from our{" "}
            <span className="italic text-amber-600">community</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Real experiences from caregivers who are using COCO to make their
            journey easier.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
}
