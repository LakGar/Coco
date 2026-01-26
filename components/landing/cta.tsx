"use client";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Users, Shield, Heart } from "lucide-react";

const benefits = [
  { icon: Users, text: "Join 10K+ caregivers" },
  { icon: Shield, text: "HIPAA compliant" },
  { icon: Heart, text: "Free forever plan" },
];

export default function CTA() {
  return (
    <section id="waitlist" className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
          }}
        />
      </div>
      
      {/* Decorative blur elements */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Start your care journey today</span>
          </motion.div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight">
            Ready to care{" "}
            <span className="italic">together</span>?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of caregivers who are finding peace, support, and better outcomes with COCO. Start free, no credit card required.
          </p>

          {/* Benefits */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.a
              href="/sign-up"
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white text-amber-600 rounded-full font-medium text-lg hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-3">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
            </motion.a>
            <motion.a
              href="/pricing"
              className="inline-flex items-center px-10 py-5 bg-transparent border-2 border-white/50 text-white rounded-full font-medium text-lg hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Pricing
            </motion.a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-12 pt-8 border-t border-white/20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <p className="text-sm text-white/70 mb-4">Trusted by caregivers worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-white/50">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="text-xs">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="text-xs">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="text-xs">Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
