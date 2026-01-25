"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { Linkedin, Twitter, Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const teamMembers = [
  {
    name: "Alex Chen",
    role: "Co-Founder & CEO",
    bio: "Former healthcare tech executive with 10+ years building products that matter. Passionate about making caregiving more human.",
    avatar: "AC",
    gradient: "from-blue-400 to-cyan-500",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "alex@coco.app",
    },
  },
  {
    name: "Sarah Martinez",
    role: "Co-Founder & Head of Product",
    bio: "Product designer turned caregiver advocate. Built COCO after experiencing the challenges of coordinating care for her grandmother.",
    avatar: "SM",
    gradient: "from-rose-400 to-pink-500",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "sarah@coco.app",
    },
  },
  {
    name: "Michael Park",
    role: "Head of Engineering",
    bio: "Full-stack engineer with a passion for building intuitive experiences. Believes technology should fade into the background.",
    avatar: "MP",
    gradient: "from-amber-400 to-orange-500",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "michael@coco.app",
    },
  },
  {
    name: "Emily Johnson",
    role: "Community Lead",
    bio: "Former social worker turned community builder. Dedicated to creating safe spaces where caregivers can find support and connection.",
    avatar: "EJ",
    gradient: "from-purple-400 to-indigo-500",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "emily@coco.app",
    },
  },
  {
    name: "David Kim",
    role: "Head of Design",
    bio: "Designer focused on creating calm, thoughtful interfaces. Believes good design should feel invisible and supportive.",
    avatar: "DK",
    gradient: "from-green-400 to-emerald-500",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "david@coco.app",
    },
  },
  {
    name: "Rachel Thompson",
    role: "Head of Partnerships",
    bio: "Healthcare industry veteran connecting COCO with providers, organizations, and communities to expand our impact.",
    avatar: "RT",
    gradient: "from-violet-400 to-purple-500",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "rachel@coco.app",
    },
  },
];

export default function TeamPage() {
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
            Meet the <span className="italic text-amber-600">Team</span>
          </motion.h1>
          <motion.p
            className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We&apos;re a team of caregivers, technologists, and advocates united by a shared mission: 
            making caregiving more manageable and less isolating.
          </motion.p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-rose-100/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/50 transition-all duration-500 hover:shadow-xl">
                  <div className="flex flex-col items-center text-center mb-6">
                    <Avatar className="h-24 w-24 border-4 border-gray-100 mb-4 group-hover:scale-110 transition-transform duration-500">
                      <AvatarFallback className={`bg-gradient-to-br ${member.gradient} text-white text-2xl font-medium`}>
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-medium text-gray-900 mb-1 group-hover:text-gray-950 transition-colors">
                      {member.name}
                    </h3>
                    <p className={`text-sm font-medium bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent mb-4`}>
                      {member.role}
                    </p>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {member.bio}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-100">
                    <a
                      href={member.social.linkedin}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-amber-100 flex items-center justify-center transition-all duration-300 hover:scale-110"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5 text-gray-600" />
                    </a>
                    <a
                      href={member.social.twitter}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-amber-100 flex items-center justify-center transition-all duration-300 hover:scale-110"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-5 h-5 text-gray-600" />
                    </a>
                    <a
                      href={`mailto:${member.social.email}`}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-amber-100 flex items-center justify-center transition-all duration-300 hover:scale-110"
                      aria-label="Email"
                    >
                      <Mail className="w-5 h-5 text-gray-600" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-light text-gray-900 mb-6">
              Want to join us?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              We&apos;re always looking for passionate people who want to make a difference in caregiving. 
              Check out our open positions or reach out if you think you&apos;d be a good fit.
            </p>
            <a
              href="mailto:careers@coco.app"
              className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium text-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              View Open Positions
              <span className="text-xl">→</span>
            </a>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
