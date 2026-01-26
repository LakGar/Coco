"use client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { Linkedin, Twitter, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

const teamMembers = [
  {
    name: "Alex Chen",
    role: "Co-Founder & CEO",
    bio: "Former healthcare tech executive with 10+ years building products that matter. Passionate about making caregiving more human.",
    avatar: "AC",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
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
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
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
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
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
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
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
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
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
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face",
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
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1080&fit=crop&q=80"
              alt="Team collaboration"
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
                Meet the <span className="italic">Team</span>
              </motion.h1>
              <motion.p
                className="text-xl text-white/95 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                We&apos;re a team of caregivers, technologists, and advocates
                united by a shared mission: making caregiving more manageable
                and less isolating.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-amber-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 group-hover:-translate-y-1">
                  <div className="flex flex-col items-center text-center mb-6">
                    <Avatar className="h-24 w-24 border-4 border-gray-100 mb-4 group-hover:scale-110 transition-transform duration-500">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback
                        className={`bg-gradient-to-br ${member.gradient} text-white text-2xl font-medium`}
                      >
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-medium text-gray-900 mb-1 group-hover:text-gray-950 transition-colors">
                      {member.name}
                    </h3>
                    <p
                      className={`text-sm font-medium bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent mb-4`}
                    >
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
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              Want to join <span className="italic text-amber-600">us</span>?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              We&apos;re always looking for passionate people who want to make a
              difference in caregiving. Check out our open positions or reach
              out if you think you&apos;d be a good fit.
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
