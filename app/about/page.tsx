"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { Heart, Users, Lightbulb, Target } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Compassion First",
    description: "Every feature we build starts with understanding the emotional journey of caregiving.",
    gradient: "from-rose-400/20 to-pink-400/20",
    iconGradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Community Centered",
    description: "We believe the best care happens when people come together to support one another.",
    gradient: "from-blue-400/20 to-cyan-400/20",
    iconGradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Lightbulb,
    title: "Pattern Recognition",
    description: "We help you discover what works through gentle observation and intelligent insights.",
    gradient: "from-amber-400/20 to-orange-400/20",
    iconGradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Target,
    title: "Sustainable Care",
    description: "Our goal is to make caregiving more manageable, not more complicated.",
    gradient: "from-green-400/20 to-emerald-400/20",
    iconGradient: "from-green-500 to-emerald-500",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-8 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            About <span className="italic text-amber-600">COCO</span>
          </motion.h1>
          <motion.p
            className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We&apos;re building a platform that recognizes caregiving as one of life&apos;s most meaningful journeys—one that shouldn&apos;t be walked alone.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-8">
              Our Mission
            </h2>
            <div className="prose prose-lg max-w-none space-y-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                COCO was born from a simple observation: caring for someone you love is both deeply rewarding and profoundly challenging. 
                Too often, caregivers find themselves overwhelmed, isolated, and struggling to coordinate with family members and care teams.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                We believe that caregiving shouldn&apos;t mean carrying everything alone. That&apos;s why we&apos;ve built COCO—a platform 
                that quietly notices what helps, remembers what matters, and gently guides you toward understanding the patterns that bring peace.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                At the heart of COCO is our community. We&apos;ve seen how powerful it is when caregivers come together to share experiences, 
                offer support, and learn from one another. This isn&apos;t just a tool—it&apos;s a movement toward more compassionate, 
                connected care.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-4">
              Our <span className="italic text-amber-600">Values</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="group relative h-full"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/50 transition-all duration-500 hover:shadow-xl">
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${value.iconGradient} mb-6 group-hover:scale-110 transition-transform duration-500`}>
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-3 group-hover:text-gray-950 transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                      {value.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-500 to-orange-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-light text-white mb-6">
              Join us on this journey
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Whether you&apos;re a caregiver, family member, or healthcare provider, we&apos;d love to have you be part of the COCO community.
            </p>
            <a
              href="/sign-up"
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-amber-600 rounded-full font-medium text-lg hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              Get Started
              <span className="text-xl">→</span>
            </a>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
