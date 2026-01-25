"use client";
import { motion } from "framer-motion";
import { UserPlus, Users, Heart, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Care Team",
    description: "Invite family members, caregivers, and healthcare providers to join your care circle. Set up permissions and roles to ensure everyone stays informed.",
    gradient: "from-blue-400/20 to-cyan-400/20",
    iconGradient: "from-blue-500 to-cyan-500",
    borderGradient: "hover:border-blue-200/50",
    shadowGradient: "hover:shadow-blue-500/10",
  },
  {
    number: "02",
    icon: Users,
    title: "Connect with Community",
    description: "Join forums, participate in discussions, and find support from others on similar journeys. Share experiences and learn from the community.",
    gradient: "from-amber-400/20 to-orange-400/20",
    iconGradient: "from-amber-500 to-orange-500",
    borderGradient: "hover:border-amber-200/50",
    shadowGradient: "hover:shadow-amber-500/10",
  },
  {
    number: "03",
    icon: Heart,
    title: "Start Caring Together",
    description: "Coordinate care, share updates, track routines, and document important moments together. Keep everyone in sync with real-time notifications.",
    gradient: "from-rose-400/20 to-pink-400/20",
    iconGradient: "from-rose-500 to-pink-500",
    borderGradient: "hover:border-rose-200/50",
    shadowGradient: "hover:shadow-rose-500/10",
  },
  {
    number: "04",
    icon: CheckCircle,
    title: "Find Your Patterns",
    description: "Let COCO help you discover what works best and build sustainable care routines. Get insights and recommendations based on your data.",
    gradient: "from-emerald-400/20 to-green-400/20",
    iconGradient: "from-emerald-500 to-green-500",
    borderGradient: "hover:border-emerald-200/50",
    shadowGradient: "hover:shadow-emerald-500/10",
  },
];

export default function HowItWorks() {
  return (
    <section id="demo" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
      {/* Background blur elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl" />
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
            How it <span className="italic text-amber-600">works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Getting started with COCO is simple. In just a few steps, you&apos;ll have your care team connected and ready to support.
          </p>
        </motion.div>

        <div className="relative">
          {/* Elegant connection line for desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 -z-0">
            <svg className="w-full h-full" viewBox="0 0 1200 2" preserveAspectRatio="none">
              <motion.path
                d="M 0 1 Q 300 0.5, 600 1 T 1200 1"
                stroke="url(#stepGradient)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5 5"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.5 }}
              />
              <defs>
                <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="33%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="66%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Mobile connection line */}
          <div className="lg:hidden absolute left-8 top-0 bottom-0 w-0.5">
            <motion.div
              className="w-full h-full rounded-full"
              style={{
                background: "linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 0%, rgba(245, 158, 11, 0.3) 33%, rgba(244, 63, 94, 0.3) 66%, rgba(16, 185, 129, 0.3) 100%)",
              }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  className="relative group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  {/* Step number badge - positioned absolutely for better layout */}
                  <div className="flex items-start gap-4 mb-6">
                    <motion.div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.iconGradient} flex items-center justify-center text-white text-xl font-semibold shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-500`}
                      whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {step.number}
                    </motion.div>
                    {/* Arrow connector for mobile */}
                    <div className="lg:hidden flex-1 pt-6">
                      <ArrowRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>

                  {/* Main card */}
                  <div className={`h-full p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 ${step.borderGradient} transition-all duration-500 hover:shadow-2xl ${step.shadowGradient} group-hover:-translate-y-1`}>
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                    
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.iconGradient} bg-opacity-10 flex items-center justify-center mb-6 group-hover:bg-opacity-20 transition-all duration-500 group-hover:scale-110`}>
                        <Icon className={`w-7 h-7 text-transparent bg-gradient-to-br ${step.iconGradient} bg-clip-text`} />
                      </div>

                      <h3 className="text-xl font-medium text-gray-900 mb-3 group-hover:text-gray-950 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium text-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
