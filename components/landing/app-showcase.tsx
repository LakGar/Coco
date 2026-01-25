"use client";
import { motion } from "framer-motion";
import { Bell, Lightbulb, Activity, Users, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data for insights
const weeklyInsights = [
  {
    id: "1",
    type: "mood",
    message: "Mood has been calmer the past 2 days",
    icon: TrendingUp,
  },
  {
    id: "2",
    type: "routine",
    message: "Morning routine completed consistently this week",
    icon: Lightbulb,
  },
];

// Mock notifications
const notifications = [
  {
    id: "1",
    message: "Sarah completed 'Morning Medication'",
    time: "5m ago",
    unread: true,
  },
  {
    id: "2",
    message: "New note added by Michael",
    time: "1h ago",
    unread: true,
  },
  {
    id: "3",
    message: "Routine reminder: Evening walk",
    time: "2h ago",
    unread: false,
  },
];

// Mock family activity
const familyActivity = [
  { name: "Sarah", avatar: "SM", action: "completed a task", time: "5m ago" },
  { name: "Michael", avatar: "MR", action: "added a note", time: "1h ago" },
  { name: "Emily", avatar: "ET", action: "tracked mood", time: "3h ago" },
];

export default function AppShowcase() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
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
            Stay connected, stay{" "}
            <span className="italic text-amber-600">informed</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Real-time updates keep your care team aligned. See what matters,
            when it matters.
          </p>
        </motion.div>

        {/* Three column showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weekly Insights */}
          <motion.div
            className="relative group"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-amber-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Weekly Insights
                  </h3>
                  <p className="text-xs text-gray-500">Patterns & trends</p>
                </div>
              </div>
              <div className="space-y-4">
                {weeklyInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-100/50"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white/80">
                        <insight.icon className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">
                        {insight.message}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Smart Notifications */}
          <motion.div
            className="relative group"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-rose-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-rose-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Notifications
                  </h3>
                  <p className="text-xs text-gray-500">Team updates</p>
                </div>
              </div>
              <div className="space-y-3">
                {notifications.map((notif, index) => (
                  <motion.div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      notif.unread
                        ? "bg-gradient-to-br from-rose-50/50 to-pink-50/30 border-rose-100/50"
                        : "bg-gray-50/50 border-gray-100/50"
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  >
                    <div className="flex items-start gap-3">
                      {notif.unread && (
                        <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notif.time}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Family Activity */}
          <motion.div
            className="relative group"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-blue-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Family Activity
                  </h3>
                  <p className="text-xs text-gray-500">Live updates</p>
                </div>
              </div>
              <div className="space-y-4">
                {familyActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50/50 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  >
                    <Avatar className="h-10 w-10 border-2 border-blue-200">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white text-sm font-medium">
                        {activity.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.name}</span>{" "}
                        <span className="text-gray-600">{activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
