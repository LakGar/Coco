"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
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
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function FAQPage() {
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
            Frequently Asked <span className="italic text-amber-600">Questions</span>
          </motion.h1>
          <motion.p
            className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Find answers to common questions about COCO, our features, and how we can help you care better together.
          </motion.p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-100/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              className="mb-16 last:mb-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-3xl font-light text-gray-900 mb-8">
                {category.category}
              </h2>
              <div className="p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50">
                {category.questions.map((faq, index) => (
                  <FAQItem key={index} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Still Have Questions CTA */}
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
              Still have questions?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
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
