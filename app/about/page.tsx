"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="z-20 absolute top-5 left-0 w-full px-10">
        <Navbar />
      </div>
      {/* Full-Screen Hero Section */}
      <section className="min-h-screen bg-white relative overflow-visible md:p-6 flex flex-col items-center justify-center">
        {/* Hero Content Container with Image Background */}
        <div className="w-screen h-screen md:w-[calc(100vw-3rem)] md:h-[calc(100vh-3rem)] relative md:rounded-3xl lg:rounded-3xl overflow-hidden md:overflow-visible flex flex-col">
          {/* Background Image */}
          <div className="absolute inset-0 overflow-hidden md:rounded-3xl lg:rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1517267667008-3b8018f4b4f7?w=1920&h=1080&fit=crop&q=80"
              alt="Caregiving support"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950/50 via-orange-950/40 to-rose-950/50" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-white mb-8 leading-tight tracking-tight">
                  Care is ongoing,
                  <br />
                  not episodic
                </h1>
                <p className="text-xl sm:text-2xl text-white/95 max-w-2xl mx-auto leading-relaxed font-light mb-12">
                  COCO is a support system for caregivers, families, and
                  patients—designed to bring clarity and continuity to the care
                  journey.
                </p>
                <motion.a
                  href="#mission"
                  className="inline-block text-white/90 hover:text-white border-b border-white/40 hover:border-white/60 transition-colors text-lg font-light tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Our Mission
                </motion.a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
                Our <span className="italic text-amber-600">Mission</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Building a platform that recognizes caregiving as one of
                life&apos;s most meaningful journeys.
              </p>
            </div>

            <div className="space-y-8 text-lg leading-relaxed text-gray-700">
              <p>
                COCO was born from a simple observation: caring for someone you
                love is both deeply rewarding and profoundly challenging. Too
                often, caregivers find themselves overwhelmed, isolated, and
                struggling to coordinate with family members and care teams.
              </p>
              <p>
                We believe that caregiving shouldn&apos;t mean carrying
                everything alone. That&apos;s why we&apos;ve built COCO—a
                platform that quietly notices what helps, remembers what
                matters, and gently guides you toward understanding the patterns
                that bring peace.
              </p>
              <p>
                At the heart of COCO is our community. We&apos;ve seen how
                powerful it is when caregivers come together to share
                experiences, offer support, and learn from one another. This
                isn&apos;t just a tool—it&apos;s a movement toward more
                compassionate, connected care.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What COCO Believes */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gray-50/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
                What COCO{" "}
                <span className="italic text-amber-600">Believes</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                The principles that guide how we think about care and
                continuity.
              </p>
            </div>

            <div className="space-y-10 text-lg leading-relaxed text-gray-700">
              <div>
                <p className="mb-4">
                  <strong className="font-normal text-gray-900">
                    Care is ongoing, not episodic.
                  </strong>{" "}
                  The moments between appointments matter just as much as the
                  appointments themselves. Daily routines, mood changes, and
                  small observations build a complete picture over time.
                </p>
              </div>

              <div>
                <p className="mb-4">
                  <strong className="font-normal text-gray-900">
                    Patterns matter more than single events.
                  </strong>{" "}
                  One difficult day doesn&apos;t define the journey.
                  Understanding what works—and what doesn&apos;t—comes from
                  seeing the whole picture, not just isolated moments.
                </p>
              </div>

              <div>
                <p className="mb-4">
                  <strong className="font-normal text-gray-900">
                    Families deserve clarity, not more work.
                  </strong>{" "}
                  Caregiving is already demanding enough. COCO should make
                  coordination easier, not add another thing to manage. When
                  everyone can see the same information, decisions become
                  clearer and care becomes more consistent.
                </p>
              </div>

              <div>
                <p>
                  <strong className="font-normal text-gray-900">
                    Continuity creates trust.
                  </strong>{" "}
                  When multiple caregivers—family members, professional
                  caregivers, healthcare providers—can see the same history and
                  observations, care becomes more coherent. Everyone understands
                  what&apos;s been tried, what&apos;s working, and what needs
                  attention.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How COCO Fits Into Care */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
                How COCO Fits Into{" "}
                <span className="italic text-amber-600">Care</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Supporting the daily rhythm of caregiving and shared
                understanding across families and care teams.
              </p>
            </div>

            <div className="space-y-8 text-lg leading-relaxed text-gray-700">
              <p>
                COCO supports the daily rhythm of care. Family members can log
                routines—medications taken, meals prepared, walks completed.
                They can note observations about mood, sleep, or changes in
                behavior. These small entries, made over time, create a clear
                picture of what&apos;s happening day to day.
              </p>

              <p>
                When multiple people are involved in care, COCO becomes a shared
                space. A daughter can see that her brother already gave the
                morning medication. A visiting nurse can review the week&apos;s
                notes before arriving. A doctor can see patterns in mood or
                sleep that might inform treatment decisions.
              </p>

              <p>
                Care plans live in COCO, too. They&apos;re not static documents
                but living guides that evolve as needs change. When something
                works well, it can be incorporated. When something doesn&apos;t,
                it can be adjusted. Everyone stays aligned on what the plan is
                and why it matters.
              </p>

              <p>
                Most importantly, COCO helps families and care teams develop a
                shared understanding. When everyone can see the same
                information—the routines, the observations, the care
                plan—conversations become more productive. Decisions feel more
                informed. Care feels more coordinated.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/30">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              If you&apos;re caring for someone with dementia, or supporting
              someone who is, we&apos;d like COCO to be part of your journey.
            </p>
            <a
              href="/sign-up"
              className="inline-block text-gray-900 hover:text-amber-600 border-b border-gray-300 hover:border-amber-600 transition-colors text-lg font-light tracking-wide"
            >
              Get Started
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
