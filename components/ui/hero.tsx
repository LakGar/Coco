"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function ShaderShowcase() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden p-6">
      {/* Hero Content Container with Image Background */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full mx-auto relative rounded-3xl overflow-hidden min-h-screen flex flex-col">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1593100126453-19b562a800c1?q=80&w=1467&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Caregiving - Elderly care and support"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          {/* Soft, warm overlay for comforting feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/50 via-orange-950/40 to-rose-950/50" />

          {/* Navbar */}
          <div className="relative z-20">
            <Navbar />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 flex-1 flex items-center px-6 lg:px-12 py-20">
            <div className="max-w-6xl mx-auto w-full">
              {/* Main Content */}
              <div className="flex flex-col justify-center max-w-3xl">
                {/* Headline */}
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-8 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  When moments feel overwhelming, we help you find the patterns
                  that bring peace.
                </motion.h1>

                {/* Description */}
                <motion.p
                  className="text-lg md:text-xl text-white/85 mb-10 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                  COCO quietly notices what helps, remembers what matters, and
                  gently guides you toward understanding. Because caring for
                  someone you love shouldn&apos;t mean carrying everything
                  alone.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  className="flex items-center gap-4 flex-wrap mb-16"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                  <a
                    href="#waitlist"
                    className="px-8 py-3.5 bg-white/95 text-gray-900 rounded-full font-normal text-base hover:bg-white transition-all duration-200"
                  >
                    Join our community
                  </a>
                  <a
                    href="#demo"
                    className="px-8 py-3.5 bg-transparent border border-white/40 text-white rounded-full font-normal text-base hover:bg-white/10 hover:border-white/60 transition-all duration-200"
                  >
                    Learn more
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
