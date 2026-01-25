"use client";
import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bell, Calendar, Users, CheckCircle2, Circle } from "lucide-react";
import { RoutineCircularChart } from "@/components/routine-circular-chart";

export function FeaturesSectionWithBentoGrid() {
  const features = [
    {
      title: "Care Team Coordination",
      description:
        "Seamlessly coordinate with family members, caregivers, and healthcare providers in one unified platform.",
      skeleton: <SkeletonOne />,
      className: "col-span-1 md:col-span-4 lg:col-span-4",
    },
    {
      title: "Smart Notifications",
      description:
        "Stay informed with intelligent notifications that keep your care team aligned and aware of important updates.",
      skeleton: <SkeletonTwo />,
      className: "col-span-1 md:col-span-2 lg:col-span-2",
    },
    {
      title: "Routine Management",
      description:
        "Track daily routines, medications, and appointments with intelligent scheduling and reminders.",
      skeleton: <SkeletonThree />,
      className: "col-span-1 md:col-span-3 lg:col-span-3",
    },
    {
      title: "Community Connectivity",
      description:
        "Connect with caregivers worldwide. Join a global community of support, share experiences, and find strength together.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 md:col-span-3 lg:col-span-3",
    },
  ];
  return (
    <div className="relative z-20 py-10 lg:py-40 max-w-7xl mx-auto">
      <div className="px-8">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-light text-gray-900 dark:text-white">
          Everything you need to{" "}
          <span className="italic text-amber-600">care together</span>
        </h4>

        <p className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-gray-600 text-center font-normal leading-relaxed dark:text-neutral-300">
          Powerful tools designed to bring your care team closer and make
          caregiving more manageable.
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 mt-12 gap-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              className={feature.className}
              overflowHidden={index === 0}
            >
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
  overflowHidden = false,
}: {
  children?: React.ReactNode;
  className?: string;
  overflowHidden?: boolean;
}) => {
  return (
    <div
      className={cn(
        `p-4 sm:p-8 relative rounded-2xl bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow duration-300`,
        overflowHidden ? "overflow-hidden" : "overflow-visible",
        className,
      )}
    >
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="max-w-5xl mx-auto text-left tracking-tight text-gray-900 dark:text-white text-xl md:text-2xl md:leading-snug font-medium">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "text-sm md:text-base max-w-4xl text-left mx-auto",
        "text-gray-600 text-center font-normal leading-relaxed dark:text-neutral-300",
        "text-left max-w-sm mx-0 md:text-sm my-2",
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <div className="w-full h-full bg-white dark:bg-neutral-900 shadow-2xl group rounded-lg overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="/feature.png?v=2"
            alt="Care Team Coordination"
            fill
            className="object-cover rounded-lg"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTwo = () => {
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
    {
      id: "5",
      type: "ROUTINE_MISSED",
      title: "Team Update",
      message: "Emily updated the care plan",
      isRead: true,
      time: "4h ago",
      icon: Users,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="relative flex flex-col gap-3 h-full p-2 overflow-visible">
      {notifications.map((notif, index) => {
        const Icon = notif.icon;
        const zIndex = notifications.length - index;
        const scale = 1 - index * 0.05;
        const translateY = index * -8;
        const opacity = index < 3 ? 1 : 0.6;

        return (
          <motion.div
            key={notif.id}
            className={cn(
              "p-4 rounded-lg transition-all duration-200",
              notif.isRead
                ? "bg-card opacity-75 shadow-sm"
                : "bg-gradient-to-br from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-950/10 shadow-lg",
            )}
            style={{
              zIndex,
              transform: `scale(${scale}) translateY(${translateY}px)`,
              opacity,
              boxShadow:
                index < 2
                  ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                  : undefined,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity, y: translateY, scale }}
            transition={{ delay: index * 0.1 }}
            whileHover={{
              scale: scale + 0.05,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <div className={cn("p-2 rounded-md bg-muted", notif.color)}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm leading-tight">
                    {notif.title}
                  </h3>
                  {notif.isRead ? (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  {notif.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {notif.time}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export const SkeletonThree = () => {
  // Mock routine data for display
  const routines = [
    {
      name: "Morning Medication",
      recurrenceDaysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily
      instances: [
        { entryDate: new Date().toISOString().split("T")[0] },
        {
          entryDate: new Date(Date.now() - 86400000)
            .toISOString()
            .split("T")[0],
        },
        {
          entryDate: new Date(Date.now() - 172800000)
            .toISOString()
            .split("T")[0],
        },
        {
          entryDate: new Date(Date.now() - 259200000)
            .toISOString()
            .split("T")[0],
        },
        {
          entryDate: new Date(Date.now() - 345600000)
            .toISOString()
            .split("T")[0],
        },
      ],
      color: "emerald",
    },
    {
      name: "Evening Walk",
      recurrenceDaysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      instances: [
        {
          entryDate: new Date(Date.now() - 86400000)
            .toISOString()
            .split("T")[0],
        },
        {
          entryDate: new Date(Date.now() - 259200000)
            .toISOString()
            .split("T")[0],
        },
      ],
      color: "blue",
    },
  ];

  const getCompletionRate = (routine: (typeof routines)[0]) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = routine.recurrenceDaysOfWeek.map((dayIndex) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + dayIndex);
      return dayDate.toISOString().split("T")[0];
    });

    const completed = weekDays.filter((dayStr) =>
      routine.instances.some((inst) => inst.entryDate === dayStr),
    ).length;

    return Math.round((completed / routine.recurrenceDaysOfWeek.length) * 100);
  };

  return (
    <div className="relative flex flex-col gap-3 h-full p-2">
      {routines.map((routine, index) => {
        const completionRate = getCompletionRate(routine);
        const completedCount = routine.instances.length;
        const totalDays = routine.recurrenceDaysOfWeek.length;

        return (
          <motion.div
            key={index}
            className={cn(
              "rounded-lg bg-card shadow-sm hover:shadow-md transition-all duration-200 group",
              index === 0 ? "p-3" : "p-4",
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex flex-col items-center">
                <RoutineCircularChart
                  recurrenceDaysOfWeek={routine.recurrenceDaysOfWeek}
                  instances={routine.instances}
                  size={index === 0 ? 70 : 90}
                  barWidth={index === 0 ? 7 : 9}
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  this week
                </p>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-semibold text-sm leading-tight mb-1.5 group-hover:text-foreground transition-colors">
                  {routine.name}
                </h3>
                <div className={cn("space-y-1.5", index === 1 && "space-y-2")}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        transition={{
                          delay: index * 0.15 + 0.2,
                          duration: 0.5,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {completedCount}/{totalDays}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
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
};

export const SkeletonFour = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative bg-transparent dark:bg-transparent overflow-visible">
      <div className="relative w-full h-full flex items-center justify-center">
        <Globe className="relative" />
      </div>
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        aspectRatio: 1,
      }}
      className={className}
    />
  );
};
