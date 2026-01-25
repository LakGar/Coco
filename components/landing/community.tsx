"use client";
import { motion } from "framer-motion";
import { MessageCircle, Users, Heart, Shield, Sparkles, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const communityFeatures = [
  {
    icon: MessageCircle,
    title: "Support Forums",
    description: "Join conversations, ask questions, and share your journey with others who understand.",
  },
  {
    icon: Users,
    title: "Care Circles",
    description: "Form private groups with your care team and extended family for focused collaboration.",
  },
  {
    icon: Heart,
    title: "Peer Support",
    description: "Connect with caregivers facing similar challenges and build meaningful relationships.",
  },
  {
    icon: Shield,
    title: "Safe Space",
    description: "A judgment-free environment where you can be vulnerable and find genuine support.",
  },
];

const stats = [
  { number: "10K+", label: "Active Members" },
  { number: "50K+", label: "Support Messages" },
  { number: "1K+", label: "Daily Connections" },
  { number: "24/7", label: "Community Support" },
];

// Mock activity feed data
const recentActivity = [
  { 
    name: "Sarah M.", 
    avatar: "SM", 
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    action: "shared a care tip", 
    time: "2h ago" 
  },
  { 
    name: "Michael R.", 
    avatar: "MR", 
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    action: "asked about medication timing", 
    time: "4h ago" 
  },
  { 
    name: "Emily T.", 
    avatar: "ET", 
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    action: "celebrated a small win", 
    time: "6h ago" 
  },
  { 
    name: "David L.", 
    avatar: "DL", 
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    action: "posted in support forum", 
    time: "8h ago" 
  },
];

export default function Community() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
      {/* Background blur elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100/80 backdrop-blur-sm border border-amber-200/50 text-amber-700 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Community First</span>
          </motion.div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
            You&apos;re not alone in this{" "}
            <span className="italic text-amber-600">journey</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our community is the heart of COCO. Connect with thousands of caregivers who understand your challenges, 
            celebrate your victories, and support you every step of the way.
          </p>
        </motion.div>

        {/* Stats with fluid design */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative group text-center p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-amber-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <div className="text-5xl md:text-6xl font-light text-amber-600 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Two column layout: Features + Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Community Features */}
          <div className="space-y-4">
            {communityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="relative group p-6 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-amber-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Live Activity Feed */}
          <motion.div
            className="relative group p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-amber-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-lg font-medium text-gray-900">Live Community Activity</h3>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50/50 transition-colors border border-transparent hover:border-amber-100/50"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <Avatar className="h-10 w-10 border-2 border-amber-200">
                    <AvatarImage src={activity.image} alt={activity.name} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-medium">
                      {activity.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.name}</span>{" "}
                      <span className="text-gray-600">{activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                <Activity className="w-4 h-4" />
                <span>Join the conversation</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium text-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Join the Community
            <span className="text-xl">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
