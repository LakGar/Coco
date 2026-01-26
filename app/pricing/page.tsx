"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { Check } from "lucide-react";
import Image from "next/image";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description:
      "Perfect for individuals getting started with care coordination.",
    features: [
      "Up to 3 care team members",
      "Basic routine tracking",
      "Community forum access",
      "Care notes (up to 50)",
      "Basic notifications",
    ],
    cta: "Get Started",
    popular: false,
    gradient: "from-gray-400/20 to-gray-500/20",
    borderGradient: "from-gray-200 to-gray-300",
  },
  {
    name: "Family",
    price: "$19",
    period: "per month",
    description: "Ideal for families coordinating care together.",
    features: [
      "Unlimited care team members",
      "Advanced routine management",
      "Priority community support",
      "Unlimited care notes",
      "Smart notifications & reminders",
      "Care insights & analytics",
      "Caregiver burden tracking",
      "Priority customer support",
    ],
    cta: "Start Free Trial",
    popular: true,
    gradient: "from-amber-400/30 to-orange-400/30",
    borderGradient: "from-amber-400 to-orange-500",
  },
  {
    name: "Professional",
    price: "$99",
    period: "per month",
    description: "For healthcare providers and care organizations.",
    features: [
      "Everything in Family",
      "Multi-team management",
      "Advanced analytics & reporting",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "Training & onboarding",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-purple-400/20 to-indigo-400/20",
    borderGradient: "from-purple-200 to-indigo-300",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="z-20 absolute top-5 left-0 w-full px-10">
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="min-h-screen bg-white relative overflow-visible md:p-6 flex flex-col items-center justify-center">
        {/* Hero Content Container with Image Background */}
        <div className="w-screen h-screen md:w-[calc(100vw-3rem)] md:h-[calc(100vh-3rem)] relative md:rounded-3xl lg:rounded-3xl overflow-hidden md:overflow-visible flex flex-col">
          {/* Background Image */}
          <div className="absolute inset-0 overflow-hidden md:rounded-3xl lg:rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&h=1080&fit=crop&q=80"
              alt="Pricing plans"
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
              <motion.h1
                className="text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Simple, transparent <span className="italic">pricing</span>
              </motion.h1>
              <motion.p
                className="text-xl text-white/95 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Choose the plan that works for you. All plans include access to
                our supportive community.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`relative group ${
                  plan.popular ? "md:-mt-4 md:mb-4" : ""
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  className={`h-full p-10 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border-2 transition-all duration-500 hover:shadow-2xl ${
                    plan.popular
                      ? `border-transparent bg-gradient-to-br ${plan.gradient} shadow-xl scale-105`
                      : "border-gray-200/50 hover:border-gray-300/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-medium text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-6xl font-light text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${plan.popular ? "from-amber-400 to-orange-500" : "from-gray-300 to-gray-400"} flex items-center justify-center`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={
                      plan.name === "Professional"
                        ? "mailto:sales@coco.app"
                        : "/sign-up"
                    }
                    className={`block w-full text-center py-4 px-6 rounded-full font-medium transition-all duration-300 ${
                      plan.popular
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl hover:scale-105"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              Common <span className="italic text-amber-600">questions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about our plans and pricing.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "Can I change plans later?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, debit cards, and ACH transfers for annual plans.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! The Family plan includes a 14-day free trial. No credit card required to start.",
              },
              {
                q: "Do you offer discounts for annual plans?",
                a: "Yes! Annual plans receive a 20% discount compared to monthly billing.",
              },
            ].map((faq, index) => (
              <motion.div
                key={faq.q}
                className="p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-amber-200/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 relative overflow-hidden">
        <div className="absolute inset-0">
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
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)",
            }}
          />
        </div>
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight">
              Still have <span className="italic">questions</span>?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Our team is here to help. Reach out and we&apos;ll get back to you
              within 24 hours.
            </p>
            <a
              href="mailto:support@coco.app"
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-amber-600 rounded-full font-medium text-lg hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              Contact Support
              <span className="text-xl">→</span>
            </a>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
