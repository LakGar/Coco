"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  Users,
  Circle,
  ClipboardList,
  Pill,
  FileText,
  UsersRound,
} from "lucide-react";
import { RoutineCircularChart } from "@/components/routine-circular-chart";

function getRoutineMockData() {
  const now = Date.now();
  return [
    {
      name: "Morning Medication",
      recurrenceDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      instances: [
        { entryDate: new Date(now).toISOString().split("T")[0] },
        { entryDate: new Date(now - 86400000).toISOString().split("T")[0] },
        { entryDate: new Date(now - 172800000).toISOString().split("T")[0] },
        { entryDate: new Date(now - 259200000).toISOString().split("T")[0] },
        { entryDate: new Date(now - 345600000).toISOString().split("T")[0] },
      ],
    },
    {
      name: "Evening Walk",
      recurrenceDaysOfWeek: [1, 3, 5],
      instances: [
        { entryDate: new Date(now - 86400000).toISOString().split("T")[0] },
        { entryDate: new Date(now - 259200000).toISOString().split("T")[0] },
      ],
    },
  ];
}

const FEATURE_CARDS = [
  {
    title: "Assign tasks + routines",
    description:
      "Create to-do items and daily habits for your loved one. You can choose who does what and see when each task is done. No one has to remember everything alone.",
    icon: ClipboardList,
    gradient:
      "from-blue-100 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Track meds separately",
    description:
      "Keep all medications in one simple list with the right dose and time for each. You get gentle reminders so no dose is missed, and refill dates are tracked for you.",
    icon: Pill,
    gradient:
      "from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Share observations + updates",
    description:
      "Write down how the day went, any changes in mood or health, and notes from doctor visits. The whole care team can read and add updates in one place, so everyone stays informed.",
    icon: FileText,
    gradient:
      "from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Keep everyone aligned",
    description:
      "Family, paid caregivers, and doctors all see the same information. Everyone stays on the same page so your loved one gets consistent, coordinated care—without confusion or missed details.",
    icon: UsersRound,
    gradient:
      "from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

export function FeaturesSectionWithBentoGrid() {
  return (
    <div className="relative z-20 py-16 lg:py-28 max-w-7xl mx-auto">
      {/* Section with background */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Background image - soft, coherent visual */}
        <div className="absolute inset-0">
          <Image
            src="/onboarding-right.png"
            alt=""
            fill
            className="object-cover object-left opacity-[0.08] dark:opacity-[0.06]"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white dark:from-neutral-950/95 dark:via-neutral-950/90 dark:to-neutral-950" />
        </div>

        <div className="relative px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
          {/* Headline */}
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-14">
            <h2 className="text-3xl lg:text-5xl lg:leading-tight tracking-tight font-light text-gray-900 dark:text-white">
              Everything you need to{" "}
              <span className="italic text-amber-600">care together</span>
            </h2>
            <p className="text-base lg:text-lg text-gray-600 dark:text-neutral-400 mt-4 max-w-2xl mx-auto font-normal leading-relaxed">
              One place for your care team: assign work, track meds, share
              updates, and stay aligned—family, caregivers, and clinicians.
            </p>
          </div>

          {/* Four feature cards: image area + text on top */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-14 lg:mb-16">
            {FEATURE_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.article
                  key={card.title}
                  className={cn(
                    "relative rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-md border border-gray-100 dark:border-neutral-800",
                    "flex flex-col"
                  )}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  {/* Card image area - gradient + icon (no photo) */}
                  <div
                    className={cn(
                      "h-28 lg:h-32 w-full bg-gradient-to-br flex items-center justify-center",
                      card.gradient
                    )}
                  >
                    <div className={cn("rounded-2xl p-4", card.iconBg)}>
                      <Icon
                        className="w-10 h-10 lg:w-12 lg:h-12"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  {/* Text on top of card (above image in layout order; we'll use flex-col so text comes after image) */}
                  <div className="flex flex-col flex-1 p-5 lg:p-6">
                    <h3 className="text-lg font-medium tracking-tight text-gray-900 dark:text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* Two cards: Notifications + Routines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Notifications card - with background */}
            <motion.div
              className="relative rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-lg border border-gray-100 dark:border-neutral-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute inset-0">
                <Image
                  src="/hero.png"
                  alt=""
                  fill
                  className="object-cover object-center opacity-[0.04] dark:opacity-[0.03]"
                />
              </div>
              <div className="relative p-6 lg:p-8">
                <h3 className="text-xl lg:text-2xl font-medium tracking-tight text-gray-900 dark:text-white mb-1">
                  Smart Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-6 max-w-md">
                  Stay informed with updates that keep your care team aligned.
                </p>
                <div className="min-h-[280px]">
                  <SkeletonNotifications />
                </div>
              </div>
            </motion.div>

            {/* Routines card - with background */}
            <motion.div
              className="relative rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-lg border border-gray-100 dark:border-neutral-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="absolute inset-0">
                <Image
                  src="/onboarding-left.png"
                  alt=""
                  fill
                  className="object-cover object-right opacity-[0.04] dark:opacity-[0.03]"
                />
              </div>
              <div className="relative p-6 lg:p-8">
                <h3 className="text-xl lg:text-2xl font-medium tracking-tight text-gray-900 dark:text-white mb-1">
                  Routine Management
                </h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-6 max-w-md">
                  Track daily routines and meds with clear schedules and
                  reminders.
                </p>
                <div className="min-h-[280px]">
                  <SkeletonRoutines />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonNotifications() {
  const notifications = [
    {
      id: "1",
      type: "TASK_DUE",
      title: "Morning Medication Due",
      message: "Sarah completed 'Morning Medication'",
      isRead: false,
      time: "5m ago",
      icon: Calendar,
      color: "text-red-500",
    },
    {
      id: "2",
      type: "ROUTINE_MISSED",
      title: "New Note Added",
      message: "Michael added a note about today's visit",
      isRead: false,
      time: "1h ago",
      icon: Users,
      color: "text-blue-500",
    },
    {
      id: "3",
      type: "TEAM_INVITE",
      title: "Routine Reminder",
      message: "Evening walk scheduled for 6:00 PM",
      isRead: true,
      time: "2h ago",
      icon: Bell,
      color: "text-amber-500",
    },
    {
      id: "4",
      type: "TASK_DUE",
      title: "Appointment Tomorrow",
      message: "Doctor's appointment at 10:00 AM",
      isRead: false,
      time: "3h ago",
      icon: Calendar,
      color: "text-red-500",
    },
  ];

  return (
    <div className="relative flex flex-col gap-3 overflow-visible">
      {notifications.map((notif, index) => {
        const Icon = notif.icon;
        const zIndex = notifications.length - index;
        const scale = 1 - index * 0.04;
        const translateY = index * -6;
        const opacity = index < 3 ? 1 : 0.7;

        return (
          <motion.div
            key={notif.id}
            className={cn(
              "p-4 rounded-xl transition-all duration-200",
              notif.isRead
                ? "bg-gray-50/80 dark:bg-neutral-800/80 shadow-sm"
                : "bg-gradient-to-br from-rose-50/60 to-pink-50/40 dark:from-rose-950/30 dark:to-pink-950/20 shadow-md"
            )}
            style={{
              zIndex,
              transform: `scale(${scale}) translateY(${translateY}px)`,
              opacity,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity, y: translateY }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <div
                  className={cn(
                    "p-2 rounded-lg bg-white/80 dark:bg-neutral-800",
                    notif.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm leading-tight text-gray-900 dark:text-white">
                    {notif.title}
                  </h3>
                  {notif.isRead ? (
                    <Circle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                  {notif.message}
                </p>
                <span className="text-xs text-gray-500 dark:text-neutral-500 mt-1 block">
                  {notif.time}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function SkeletonRoutines() {
  const routines = useMemo(() => getRoutineMockData(), []);

  const getCompletionRate = (routine: (typeof routines)[0]) => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekDays = routine.recurrenceDaysOfWeek.map((dayIndex) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + dayIndex);
      return d.toISOString().split("T")[0];
    });
    const completed = weekDays.filter((dayStr) =>
      routine.instances.some((inst) => inst.entryDate === dayStr)
    ).length;
    return Math.round((completed / routine.recurrenceDaysOfWeek.length) * 100);
  };

  return (
    <div className="relative flex flex-col gap-4">
      {routines.map((routine, index) => {
        const completionRate = getCompletionRate(routine);
        const completedCount = routine.instances.length;
        const totalDays = routine.recurrenceDaysOfWeek.length;

        return (
          <motion.div
            key={index}
            className="rounded-xl bg-gray-50/80 dark:bg-neutral-800/80 p-4 shadow-sm border border-gray-100 dark:border-neutral-700/50"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.12 }}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex flex-col items-center">
                <RoutineCircularChart
                  recurrenceDaysOfWeek={routine.recurrenceDaysOfWeek}
                  instances={routine.instances}
                  size={index === 0 ? 64 : 80}
                  barWidth={index === 0 ? 6 : 8}
                />
                <p className="text-[10px] text-gray-500 dark:text-neutral-500 mt-1.5">
                  this week
                </p>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight mb-2">
                  {routine.name}
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        transition={{
                          delay: index * 0.12 + 0.2,
                          duration: 0.5,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-neutral-400 whitespace-nowrap">
                      {completedCount}/{totalDays}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-500">
                    {routine.recurrenceDaysOfWeek.length === 7
                      ? "Daily"
                      : `${routine.recurrenceDaysOfWeek.length}x per week`}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
