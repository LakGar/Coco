"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/navbar";
import Image from "next/image";
import { SignUpButton } from "@clerk/nextjs";

export default function Hero() {
  return (
    <div className="min-h-screen bg-white relative overflow-visible md:p-6 flex flex-col items-center justify-center">
      {/* Hero Content Container with Image Background */}
      <div className="w-screen h-screen md:w-[calc(100vw-3rem)] md:h-[calc(100vh-3rem)] relative md:rounded-3xl lg:rounded-3xl overflow-hidden md:overflow-visible flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden md:rounded-3xl lg:rounded-3xl">
          <Image
            src="https://images.unsplash.com/photo-1593100126453-19b562a800c1?q=80&w=1467&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Caregiving - Elderly care and support"
            fill
            className="object-cover "
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/50 via-orange-950/40 to-rose-950/50" />
        </div>
        {/* Soft, warm overlay for comforting feel */}

        {/* Navbar */}
        <div className="relative z-20">
          <Navbar />
        </div>

        {/* Hero Content - Centered on Mobile, Top on Desktop */}
        <div className="relative z-10 flex-1 flex items-center md:items-start px-4 sm:px-6 lg:px-12 py-8 md:pt-12 md:pb-0">
          <div className="max-w-6xl mx-auto w-full">
            {/* Main Content */}
            <div className="flex flex-col max-w-3xl text-left md:text-center md:items-center md:max-w-full">
              {/* Headline */}
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light md:text-center text-white mb-4 sm:mb-6 leading-tight sm:leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                When moments feel overwhelming, we help you{" "}
                <i className="italic">find the patterns</i> that bring peace.
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-base sm:text-lg md:text-lg text-white/85 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                COCO quietly notices what helps, remembers what matters, and
                gently guides you toward understanding. Because caring for
                someone you love shouldn&apos;t mean carrying everything alone.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8 md:mb-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              >
                <a
                  href="#waitlist"
                  className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white/25 text-white rounded-full font-normal text-sm sm:text-base text-center hover:bg-white hover:text-black transition-all duration-200"
                >
                  Join our community
                </a>

                <a href="/sign-up">
                  <button className="px-6 sm:px-8 py-3 sm:py-3.5 bg-transparent border border-white/40 text-white rounded-full font-normal text-sm sm:text-base text-center hover:bg-white/10 hover:border-white/60 transition-all duration-200">
                    Sign Up
                  </button>
                </a>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Empty Container for Future Content - Starts after buttons, extends past background */}
        <div className="hidden md:block relative z-10 px-6 lg:px-12 pt-12 pb-8  w-full ">
          <div className="max-w-6xl mx-auto w-full h-[700px] rounded-3xl overflow-hidden relative">
            {/* Content will go here */}
            <Image
              src="/dash.png"
              alt="Hero Content"
              fill
              className=" max-w-7xl h-[900px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
