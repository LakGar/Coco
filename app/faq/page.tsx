"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I get started with COCO?",
        a: "Getting started is easy! Simply sign up for a free account, invite your care team members, and start tracking routines and sharing updates. Our onboarding process will guide you through everything step by step.",
      },
      {
        q: "Do I need to download an app?",
        a: "COCO is a web-based platform that works on any device with a browser. You can access it from your computer, tablet, or smartphone. We're working on native mobile apps for iOS and Android, coming soon!",
      },
      {
        q: "How many people can be on my care team?",
        a: "The Free plan allows up to 3 care team members. The Family plan includes unlimited members, perfect for larger families coordinating care together.",
      },
    ],
  },
  {
    category: "Features",
    questions: [
      {
        q: "What is caregiver burden tracking?",
        a: "Caregiver burden tracking helps you monitor your own wellbeing as a caregiver. It uses validated assessments to help you understand your stress levels and provides insights to help you take better care of yourself while caring for others.",
      },
      {
        q: "How does routine tracking work?",
        a: "You can create routines for medications, meals, activities, and more. COCO helps you track completion, sends reminders, and identifies patterns over time to help you understand what works best.",
      },
      {
        q: "Can I share notes with my care team?",
        a: "Yes! All care notes can be shared with your care team members. You can also set permissions to control who can view or edit specific notes.",
      },
    ],
  },
  {
    category: "Community",
    questions: [
      {
        q: "How do I join the community forums?",
        a: "Community forums are available to all users, even on the Free plan. Simply navigate to the Community section and start participating in discussions. You can ask questions, share experiences, and connect with other caregivers.",
      },
      {
        q: "Is the community moderated?",
        a: "Yes, our community is actively moderated to ensure a safe, supportive, and respectful environment for all members. We have community guidelines and a team dedicated to maintaining a positive space.",
      },
      {
        q: "Can I create private groups?",
        a: "Yes! You can create private care circles with your own care team members. These are separate from the public forums and are only visible to invited members.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    questions: [
      {
        q: "How is my data protected?",
        a: "We take data security seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and are HIPAA-compliant. Your information is never shared with third parties without your explicit consent.",
      },
      {
        q: "Who can see my care information?",
        a: "Only the care team members you explicitly invite can see your care information. You have full control over who has access and what level of access they have (view-only, edit, etc.).",
      },
      {
        q: "Can I export my data?",
        a: "Yes, you can export all your data at any time. Go to Settings > Data Export to download a complete copy of your information.",
      },
    ],
  },
  {
    category: "Billing",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards, debit cards, and ACH transfers. Payment is processed securely through our payment partners.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your access will continue until the end of your current billing period.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us within 30 days of your purchase for a full refund.",
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200/50 last:border-0">
      <button
        className="w-full py-6 text-left flex items-center justify-between gap-4 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-medium text-gray-900 group-hover:text-amber-600 transition-colors flex-1">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 group-hover:text-amber-600 shrink-0 transition-all duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-6"
        >
          <p className="text-gray-600 leading-relaxed text-base">{answer}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function FAQPage() {
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
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&h=1080&fit=crop&q=80"
              alt="FAQ support"
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
                Frequently Asked <span className="italic">Questions</span>
              </motion.h1>
              <motion.p
                className="text-xl text-white/95 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Find answers to common questions about COCO, our features, and
                how we can help you care better together.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              className="mb-20 last:mb-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-8 leading-tight">
                {category.category}
              </h2>
              <div className="p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-amber-200/50 transition-all duration-500">
                {category.questions.map((faq, index) => (
                  <FAQItem key={index} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Still Have Questions CTA */}
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
              Can&apos;t find what you&apos;re looking for? Our support team is
              here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@coco.app"
                className="inline-flex items-center gap-2 px-10 py-5 bg-white text-amber-600 rounded-full font-medium text-lg hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
              >
                Contact Support
                <span className="text-xl">→</span>
              </a>
              <a
                href="/sign-up"
                className="inline-flex items-center gap-2 px-10 py-5 bg-transparent border-2 border-white/50 text-white rounded-full font-medium text-lg hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
              >
                Get Started
                <span className="text-xl">→</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
