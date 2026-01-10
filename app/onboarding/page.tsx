"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Users,
  UserPlus,
  Calendar,
  ClipboardList,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { animate, useMotionValue, motion } from "framer-motion";
import Image from "next/image";

type NotificationPreference = "email" | "text" | "both" | "none";
type UserRole = "caregiver" | "clinician";
type CareStatus = "yes" | "no";
type InviteRole = "caregiver" | "viewer";

interface OnboardingData {
  // Basic info (existing)
  displayName: string;
  phoneNumber: string;
  timezone: string;
  notificationPreference: NotificationPreference;

  // Step 1: Consent
  consentAccepted: boolean;

  // Step 2: Role
  userRole: UserRole | "";
  caringForSomeone: CareStatus | "";

  // Step 3: Patient (if caring)
  patientName: string;
  dementiaStage: string;
  whatHelps: string[];
  whatTriggers: string[];
  baselineNotes: string;

  // Step 4: Care circle invites
  invites: Array<{
    email: string;
    role: InviteRole;
  }>;

  // Step 5: Daily routine
  dailyTrackingItems: string[];
  morningCheckinTime: string;
  eveningCheckinTime: string;
  weeklySummaryEnabled: boolean;
  weeklySummaryTime: string;

  // Step 6: Care plan
  carePlanWorks: string[];
  carePlanAvoid: string[];
  carePlanSteps: string[];

  // Step 8: Support groups
  selectedGroups: string[];
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "UTC", label: "UTC" },
];

const DEMENTIA_STAGES = [
  "Early stage",
  "Middle stage",
  "Late stage",
  "Prefer not to say",
];

const DAILY_TRACKING_OPTIONS = [
  "Sleep",
  "Mood",
  "Appetite",
  "Meds taken",
  "Caregiver stress",
];

const SUPPORT_GROUPS = [
  "New caregivers",
  "Sundowning + sleep",
  "Aggression / agitation",
];

type Step =
  | "displayName"
  | "phoneNumber"
  | "timezone"
  | "notificationPreference"
  | "welcome"
  | "role"
  | "caringStatus"
  | "patient"
  | "careCircle"
  | "dailyRoutine"
  | "carePlan"
  | "copilotTutorial"
  | "supportGroups"
  | "success"
  | "complete";

// Consistent faint background for all steps
const STEP_BACKGROUNDS: Record<Step, string> = {
  welcome: "from-white to-gray-50/30",
  displayName: "from-white to-gray-50/30",
  phoneNumber: "from-white to-gray-50/30",
  timezone: "from-white to-gray-50/30",
  notificationPreference: "from-white to-gray-50/30",
  role: "from-white to-gray-50/30",
  caringStatus: "from-white to-gray-50/30",
  patient: "from-white to-gray-50/30",
  careCircle: "from-white to-gray-50/30",
  dailyRoutine: "from-white to-gray-50/30",
  carePlan: "from-white to-gray-50/30",
  copilotTutorial: "from-white to-gray-50/30",
  supportGroups: "from-white to-gray-50/30",
  success: "from-white to-gray-50/30",
  complete: "from-white to-gray-50/30",
};

function mapRange(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number
): number {
  if (fromLow === fromHigh) {
    return toLow;
  }
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [error, setError] = useState<string | null>(null);
  const id = `onboarding-${Math.random().toString(36).substr(2, 9)}`;
  const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const hueRotateMotionValue = useMotionValue(180);

  const [formData, setFormData] = useState<OnboardingData>({
    displayName: "",
    phoneNumber: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    notificationPreference: "both",
    consentAccepted: false,
    userRole: "",
    caringForSomeone: "",
    patientName: "",
    dementiaStage: "",
    whatHelps: [],
    whatTriggers: [],
    baselineNotes: "",
    invites: [],
    dailyTrackingItems: [],
    morningCheckinTime: "09:00",
    eveningCheckinTime: "20:00",
    weeklySummaryEnabled: false,
    weeklySummaryTime: "18:00",
    carePlanWorks: [],
    carePlanAvoid: [],
    carePlanSteps: [],
    selectedGroups: [],
  });

  // Dynamic step calculation based on user choices
  const getSteps = (): Step[] => {
    const baseSteps: Step[] = [
      "welcome",
      "displayName",
      "phoneNumber",
      "timezone",
      "notificationPreference",
      "role",
    ];

    if (formData.userRole === "caregiver") {
      baseSteps.push("caringStatus");

      if (formData.caringForSomeone === "yes") {
        baseSteps.push(
          "patient",
          "careCircle",
          "dailyRoutine",
          "carePlan",
          "copilotTutorial"
        );
      }
    }

    baseSteps.push("supportGroups", "success");
    return baseSteps;
  };

  const STEPS = getSteps();
  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress =
    currentStepIndex >= 0 ? ((currentStepIndex + 1) / STEPS.length) * 100 : 0;

  // Background animation setup
  const animation = { scale: 100, speed: 90 };
  const noise = { opacity: 0, scale: 1.2 };
  const color = "rgba(255, 255, 255, 1)";
  const sizing: "fill" | "stretch" = "fill";
  const animationEnabled = animation && animation.scale > 0;
  const displacementScale = animation
    ? mapRange(animation.scale, 1, 100, 20, 100)
    : 0;
  const animationDuration = animation
    ? mapRange(animation.speed, 1, 100, 1000, 50)
    : 1;

  useEffect(() => {
    if (feColorMatrixRef.current && animationEnabled) {
      hueRotateMotionValue.set(0);
      const hueRotateAnimation = animate(hueRotateMotionValue, 360, {
        duration: animationDuration / 25,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        onUpdate: (value: number) => {
          if (feColorMatrixRef.current) {
            feColorMatrixRef.current.setAttribute("values", String(value));
          }
        },
      });

      return () => {
        hueRotateAnimation.stop();
      };
    }
  }, [animationEnabled, animationDuration, hueRotateMotionValue]);

  useEffect(() => {
    if (currentStep === "complete") {
      handleSubmit();
    }
  }, [currentStep]);

  const validateStep = (step: Step): boolean => {
    setError(null);

    switch (step) {
      case "displayName":
        if (!formData.displayName.trim()) {
          setError("Display name is required");
          return false;
        }
        if (formData.displayName.trim().length < 2) {
          setError("Display name must be at least 2 characters");
          return false;
        }
        return true;

      case "phoneNumber":
        if (!formData.phoneNumber.trim()) {
          setError("Phone number is required");
          return false;
        }
        // Extract digits only for validation
        const digitsOnly = formData.phoneNumber.replace(/\D/g, "");
        if (digitsOnly.length < 10) {
          setError("Please enter a valid phone number");
          return false;
        }
        return true;

      case "timezone":
        if (!formData.timezone) {
          setError("Please select a timezone");
          return false;
        }
        return true;

      case "notificationPreference":
        if (!formData.notificationPreference) {
          setError("Please select a notification preference");
          return false;
        }
        return true;

      case "welcome":
        if (!formData.consentAccepted) {
          setError("Please accept the terms to continue");
          return false;
        }
        return true;

      case "role":
        if (!formData.userRole) {
          setError("Please select your role");
          return false;
        }
        return true;

      case "caringStatus":
        if (!formData.caringForSomeone) {
          setError("Please select an option");
          return false;
        }
        return true;

      case "patient":
        if (!formData.patientName.trim()) {
          setError("Patient name is required");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      const updatedSteps = getSteps();
      const nextIndex = currentIndex + 1;
      if (nextIndex < updatedSteps.length) {
        setCurrentStep(updatedSteps[nextIndex]);
      } else {
        setCurrentStep("complete");
      }
      window.scrollTo({ top: window.innerHeight / 2, behavior: "smooth" });
    } else {
      setCurrentStep("complete");
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      const updatedSteps = getSteps();
      setCurrentStep(updatedSteps[currentIndex - 1]);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save onboarding data");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
      const updatedSteps = getSteps();
      setCurrentStep(updatedSteps[updatedSteps.length - 1]);
    }
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length === 0) return "";
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6)
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6
    )}-${phoneNumber.slice(6, 10)}`;
  };

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    // Format phone number if it's the phoneNumber field
    if (field === "phoneNumber") {
      value = formatPhoneNumber(value);
    }
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !error) {
      handleNext();
    }
  };

  const addArrayItem = (
    field:
      | "whatHelps"
      | "whatTriggers"
      | "carePlanWorks"
      | "carePlanAvoid"
      | "carePlanSteps"
      | "dailyTrackingItems"
      | "selectedGroups",
    value: string
  ) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
    }
  };

  const removeArrayItem = (
    field:
      | "whatHelps"
      | "whatTriggers"
      | "carePlanWorks"
      | "carePlanAvoid"
      | "carePlanSteps"
      | "dailyTrackingItems"
      | "selectedGroups",
    index: number
  ) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const toggleArrayItem = (
    field: "dailyTrackingItems" | "selectedGroups",
    value: string
  ) => {
    if (formData[field].includes(value)) {
      setFormData({
        ...formData,
        [field]: formData[field].filter((v) => v !== value),
      });
    } else {
      setFormData({ ...formData, [field]: [...formData[field], value] });
    }
  };

  const currentBackground =
    STEP_BACKGROUNDS[currentStep] || STEP_BACKGROUNDS.welcome;

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="flex flex-col lg:flex-row-reverse items-center lg:items-start gap-8 lg:gap-12 w-full">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex-1 space-y-8 lg:max-w-2xl w-full flex flex-col justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-5xl font-semibold text-[rgba(101,67,33,1)] leading-[1.1] tracking-tight">
                    Welcome to
                  </h1>
                  <h1 className="text-6xl lg:text-8xl font-extrabold text-[rgba(101,67,33,1)] leading-[1.1] tracking-tight">
                    Coco
                  </h1>
                </div>

                <p className="text-xl lg:text-2xl text-[rgba(101,67,33,0.8)] leading-relaxed font-light max-w-xl">
                  A supportive tool for caregivers. This is not medical advice.
                  For emergencies, please call 911.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="flex items-start gap-3 pt-2"
              >
                <Checkbox
                  id="consent"
                  checked={formData.consentAccepted}
                  onCheckedChange={(checked) =>
                    handleInputChange("consentAccepted", checked === true)
                  }
                  className="mt-1"
                />
                <Label
                  htmlFor="consent"
                  className="text-base font-light text-[rgba(101,67,33,0.8)] cursor-pointer leading-relaxed"
                >
                  I understand and agree to the terms above
                </Label>
              </motion.div>
              {error && currentStep === "welcome" && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="pt-6"
              >
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading || !formData.consentAccepted}
                  className="flex items-center gap-3 text-[rgba(101,67,33,0.9)] hover:text-[rgba(101,67,33,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="text-xl font-medium">Continue</span>
                  <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </motion.div>

            {/* Right Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full lg:w-1/2 h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src="https://images.unsplash.com/photo-1580869318757-a6c605b061ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FyZXxlbnwwfHwwfHx8MA%3D%3D"
                  alt="Caregiving and support"
                  fill
                  className="object-cover opacity-80"
                  priority
                  unoptimized
                />
              </div>
            </motion.div>
          </div>
        );

      case "displayName":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label
                htmlFor="displayName"
                className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]"
              >
                What should we call you?
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your display name"
                    value={formData.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    onKeyDown={handleInputKeyDown}
                    autoFocus
                    disabled={loading}
                    className="text-lg h-14 bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.4)] focus-visible:border-[rgba(101,67,33,0.3)] focus-visible:ring-0 rounded-lg shadow-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || !!error}
                    className="text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-center"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
                {error && currentStep === "displayName" && (
                  <p className="text-xs text-red-600 mt-2 ml-1">{error}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-[rgba(101,67,33,0.6)]">
              This is how your name will appear to other caregivers
            </p>
          </motion.div>
        );

      case "phoneNumber":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label
                htmlFor="phoneNumber"
                className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]"
              >
                What's your phone number?
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    onKeyDown={handleInputKeyDown}
                    autoFocus
                    disabled={loading}
                    className="text-lg h-14 bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.4)] focus-visible:border-[rgba(101,67,33,0.3)] focus-visible:ring-0 rounded-lg shadow-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || !!error}
                    className="text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-center"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
                {error && currentStep === "phoneNumber" && (
                  <p className="text-xs text-red-600 mt-2 ml-1">{error}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-[rgba(101,67,33,0.6)]">
              We'll use this for important notifications and alerts
            </p>
          </motion.div>
        );

      case "timezone":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label
                htmlFor="timezone"
                className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]"
              >
                What timezone are you in?
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => {
                      handleInputChange("timezone", value);
                      setTimeout(() => {
                        if (validateStep("timezone")) {
                          handleNext();
                        }
                      }, 300);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="timezone"
                      className="w-full h-14 text-lg bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] focus:ring-0 rounded-lg shadow-sm flex-1"
                      autoFocus
                    >
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || !!error}
                    className="text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-center"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
                {error && currentStep === "timezone" && (
                  <p className="text-xs text-red-600 mt-2 ml-1">{error}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-[rgba(101,67,33,0.6)]">
              This helps us schedule reminders at the right time
            </p>
          </motion.div>
        );

      case "notificationPreference":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label
                htmlFor="notifications"
                className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]"
              >
                How would you like to receive notifications?
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Select
                    value={formData.notificationPreference}
                    onValueChange={(value: NotificationPreference) => {
                      handleInputChange("notificationPreference", value);
                      setTimeout(() => {
                        if (validateStep("notificationPreference")) {
                          handleNext();
                        }
                      }, 300);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="notifications"
                      className="w-full h-14 text-lg bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] focus:ring-0 rounded-lg shadow-sm flex-1"
                      autoFocus
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">
                        Email & Text Messages
                      </SelectItem>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="text">Text Messages Only</SelectItem>
                      <SelectItem value="none">No Notifications</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || !!error}
                    className="text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-center"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
                {error && currentStep === "notificationPreference" && (
                  <p className="text-xs text-red-600 mt-2 ml-1">{error}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-[rgba(101,67,33,0.6)]">
              You can change this later in settings
            </p>
          </motion.div>
        );

      case "role":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 text-center"
          >
            <div className="space-y-6 w-full max-w-md">
              <Label className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]">
                Choose your role
              </Label>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant={
                    formData.userRole === "caregiver" ? "default" : "outline"
                  }
                  onClick={() => {
                    const newRole = "caregiver";
                    setFormData({ ...formData, userRole: newRole });
                    setError(null);
                    // Use setTimeout with validation check to ensure state update
                    setTimeout(() => {
                      const updatedFormData = {
                        ...formData,
                        userRole: newRole,
                      };
                      if (updatedFormData.userRole) {
                        handleNext();
                      }
                    }, 100);
                  }}
                  className="w-full h-16 text-left justify-start bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] hover:bg-white hover:border-[rgba(101,67,33,0.3)] data-[variant=default]:bg-[rgba(101,67,33,0.05)] data-[variant=default]:border-[rgba(101,67,33,0.3)] rounded-lg text-base shadow-sm"
                >
                  I'm a caregiver/family member
                </Button>
                <Button
                  type="button"
                  variant={
                    formData.userRole === "clinician" ? "default" : "outline"
                  }
                  onClick={() => {
                    const newRole = "clinician";
                    setFormData({ ...formData, userRole: newRole });
                    setError(null);
                    setTimeout(() => {
                      const updatedFormData = {
                        ...formData,
                        userRole: newRole,
                      };
                      if (updatedFormData.userRole) {
                        handleNext();
                      }
                    }, 100);
                  }}
                  className="w-full h-16 text-left justify-start bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] hover:bg-white hover:border-[rgba(101,67,33,0.3)] data-[variant=default]:bg-[rgba(101,67,33,0.05)] data-[variant=default]:border-[rgba(101,67,33,0.3)] rounded-lg text-base shadow-sm"
                >
                  I'm a clinician / professional
                </Button>
              </div>
              {error && currentStep === "role" && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}
            </div>
          </motion.div>
        );

      case "caringStatus":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 text-center"
          >
            <div className="space-y-6 w-full max-w-md">
              <Label className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]">
                Are you caring for someone right now?
              </Label>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant={
                    formData.caringForSomeone === "yes" ? "default" : "outline"
                  }
                  onClick={() => {
                    const newValue = "yes";
                    setFormData({ ...formData, caringForSomeone: newValue });
                    setError(null);
                    setTimeout(() => {
                      const updatedFormData = {
                        ...formData,
                        caringForSomeone: newValue,
                      };
                      if (updatedFormData.caringForSomeone) {
                        handleNext();
                      }
                    }, 100);
                  }}
                  className="w-full h-16 text-left justify-start bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] hover:bg-white hover:border-[rgba(101,67,33,0.3)] data-[variant=default]:bg-[rgba(101,67,33,0.05)] data-[variant=default]:border-[rgba(101,67,33,0.3)] rounded-lg text-base shadow-sm"
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={
                    formData.caringForSomeone === "no" ? "default" : "outline"
                  }
                  onClick={() => {
                    const newValue = "no";
                    setFormData({ ...formData, caringForSomeone: newValue });
                    setError(null);
                    setTimeout(() => {
                      const updatedFormData = {
                        ...formData,
                        caringForSomeone: newValue,
                      };
                      if (updatedFormData.caringForSomeone) {
                        handleNext();
                      }
                    }, 100);
                  }}
                  className="w-full h-16 text-left justify-start bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] hover:bg-white hover:border-[rgba(101,67,33,0.3)] data-[variant=default]:bg-[rgba(101,67,33,0.05)] data-[variant=default]:border-[rgba(101,67,33,0.3)] rounded-lg text-base shadow-sm"
                >
                  No - join a support group only
                </Button>
              </div>
              {error && currentStep === "caringStatus" && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}
            </div>
          </motion.div>
        );

      case "patient":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-8"
          >
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <Label className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]">
                  Create your first patient
                </Label>
              </div>

              <div className="space-y-5">
                <div>
                  <Label
                    htmlFor="patientName"
                    className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-2 block"
                  >
                    Patient display name (nickname)
                  </Label>
                  <Input
                    id="patientName"
                    type="text"
                    placeholder="Enter nickname"
                    value={formData.patientName}
                    onChange={(e) =>
                      handleInputChange("patientName", e.target.value)
                    }
                    onKeyDown={handleInputKeyDown}
                    autoFocus
                    disabled={loading}
                    className="text-base h-12 bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.4)] focus-visible:border-[rgba(101,67,33,0.3)] focus-visible:ring-0 rounded-lg shadow-sm"
                  />
                  {error && currentStep === "patient" && (
                    <p className="text-xs text-red-600 mt-1 ml-2">{error}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="dementiaStage"
                    className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-2 block"
                  >
                    Dementia stage (optional)
                  </Label>
                  <Select
                    value={formData.dementiaStage}
                    onValueChange={(value) =>
                      handleInputChange("dementiaStage", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="dementiaStage"
                      className="w-full h-12 text-base bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] focus:ring-0 rounded-lg shadow-sm"
                    >
                      <SelectValue placeholder="Select stage (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMENTIA_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-2 block">
                    What helps? (quick prompts)
                  </Label>
                  <div className="space-y-2">
                    {formData.whatHelps.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.whatHelps.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-full text-sm text-[rgba(101,67,33,1)] shadow-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeArrayItem("whatHelps", idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <Input
                      type="text"
                      placeholder="Add what helps... (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addArrayItem("whatHelps", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="text-lg h-12 bg-white/50 backdrop-blur-sm border-2 border-[rgba(101,67,33,0.2)] text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.5)] focus-visible:border-[rgba(101,67,33,0.5)] focus-visible:ring-0 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-2 block">
                    What triggers? (quick prompts)
                  </Label>
                  <div className="space-y-2">
                    {formData.whatTriggers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.whatTriggers.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-full text-sm text-[rgba(101,67,33,1)] shadow-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() =>
                                removeArrayItem("whatTriggers", idx)
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <Input
                      type="text"
                      placeholder="Add what triggers... (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addArrayItem("whatTriggers", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="text-lg h-12 bg-white/50 backdrop-blur-sm border-2 border-[rgba(101,67,33,0.2)] text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.5)] focus-visible:border-[rgba(101,67,33,0.5)] focus-visible:ring-0 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || !!error}
              className="text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        );

      case "careCircle":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-8"
          >
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <Label className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]">
                  Who else helps care for them?
                </Label>
                <p className="text-sm text-[rgba(101,67,33,0.6)]">
                  Invite by email or share invite link
                </p>
              </div>

              <div className="space-y-4">
                {formData.invites.map((invite, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-lg shadow-sm"
                  >
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={invite.email}
                      onChange={(e) => {
                        const updated = [...formData.invites];
                        updated[idx].email = e.target.value;
                        handleInputChange("invites", updated);
                      }}
                      className="flex-1 bg-transparent border-none text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.5)] focus-visible:ring-0 shadow-none"
                    />
                    <Select
                      value={invite.role}
                      onValueChange={(value: InviteRole) => {
                        const updated = [...formData.invites];
                        updated[idx].role = value;
                        handleInputChange("invites", updated);
                      }}
                    >
                      <SelectTrigger className="w-32 bg-transparent border-none text-[rgba(101,67,33,1)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange(
                          "invites",
                          formData.invites.filter((_, i) => i !== idx)
                        );
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleInputChange("invites", [
                      ...formData.invites,
                      { email: "", role: "caregiver" },
                    ]);
                  }}
                  className="w-full bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] hover:bg-white hover:border-[rgba(101,67,33,0.3)] rounded-lg h-12 shadow-sm"
                >
                  + Add another person
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        );

      case "dailyRoutine":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-8"
          >
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <Label className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]">
                  Set up daily routine
                </Label>
                <p className="text-sm text-[rgba(101,67,33,0.6)]">
                  Pick 2-4 items to track daily
                </p>
              </div>

              <div className="space-y-3">
                {DAILY_TRACKING_OPTIONS.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 p-3 bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-lg hover:border-[rgba(101,67,33,0.3)] transition-colors cursor-pointer shadow-sm"
                    onClick={() => toggleArrayItem("dailyTrackingItems", item)}
                  >
                    <Checkbox
                      id={item}
                      checked={formData.dailyTrackingItems.includes(item)}
                      onCheckedChange={() =>
                        toggleArrayItem("dailyTrackingItems", item)
                      }
                    />
                    <Label
                      htmlFor={item}
                      className="text-[rgba(101,67,33,1)] cursor-pointer flex-1 text-lg"
                    >
                      {item}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <Label className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-2 block">
                    Morning check-in time
                  </Label>
                  <Input
                    type="time"
                    value={formData.morningCheckinTime}
                    onChange={(e) =>
                      handleInputChange("morningCheckinTime", e.target.value)
                    }
                    className="bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] focus-visible:border-[rgba(101,67,33,0.3)] focus-visible:ring-0 rounded-lg h-12 shadow-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-2 block">
                    Evening check-in time
                  </Label>
                  <Input
                    type="time"
                    value={formData.eveningCheckinTime}
                    onChange={(e) =>
                      handleInputChange("eveningCheckinTime", e.target.value)
                    }
                    className="bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] focus-visible:border-[rgba(101,67,33,0.3)] focus-visible:ring-0 rounded-lg h-12 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-lg shadow-sm">
                <Checkbox
                  id="weeklySummary"
                  checked={formData.weeklySummaryEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("weeklySummaryEnabled", checked === true)
                  }
                />
                <div className="flex-1">
                  <Label
                    htmlFor="weeklySummary"
                    className="text-[rgba(101,67,33,1)] cursor-pointer text-lg"
                  >
                    Weekly summary every Sunday
                  </Label>
                  {formData.weeklySummaryEnabled && (
                    <Input
                      type="time"
                      value={formData.weeklySummaryTime}
                      onChange={(e) =>
                        handleInputChange("weeklySummaryTime", e.target.value)
                      }
                      className="mt-2 bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] focus-visible:border-[rgba(101,67,33,0.3)] focus-visible:ring-0 rounded-lg h-10 shadow-sm"
                    />
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        );

      case "carePlan":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-8"
          >
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <Label className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]">
                  Add care plan basics
                </Label>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-3 block">
                    What works
                  </Label>
                  <div className="space-y-2">
                    {formData.carePlanWorks.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.carePlanWorks.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-full text-sm text-[rgba(101,67,33,1)] shadow-sm"
                          >
                            • {item}
                            <button
                              type="button"
                              onClick={() =>
                                removeArrayItem("carePlanWorks", idx)
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <Input
                      type="text"
                      placeholder="Add what works... (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addArrayItem("carePlanWorks", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="text-lg h-12 bg-white/50 backdrop-blur-sm border-2 border-[rgba(101,67,33,0.2)] text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.5)] focus-visible:border-[rgba(101,67,33,0.5)] focus-visible:ring-0 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-3 block">
                    What to avoid
                  </Label>
                  <div className="space-y-2">
                    {formData.carePlanAvoid.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.carePlanAvoid.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-full text-sm text-[rgba(101,67,33,1)] shadow-sm"
                          >
                            • {item}
                            <button
                              type="button"
                              onClick={() =>
                                removeArrayItem("carePlanAvoid", idx)
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <Input
                      type="text"
                      placeholder="Add what to avoid... (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addArrayItem("carePlanAvoid", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="text-lg h-12 bg-white/50 backdrop-blur-sm border-2 border-[rgba(101,67,33,0.2)] text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.5)] focus-visible:border-[rgba(101,67,33,0.5)] focus-visible:ring-0 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[rgba(101,67,33,0.8)] mb-3 block">
                    Steps when agitation happens
                  </Label>
                  <div className="space-y-2">
                    {formData.carePlanSteps.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {formData.carePlanSteps.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-3 bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-lg shadow-sm"
                          >
                            <span className="text-sm font-medium text-[rgba(101,67,33,0.6)] w-6">
                              {idx + 1}.
                            </span>
                            <span className="flex-1 text-[rgba(101,67,33,1)]">
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removeArrayItem("carePlanSteps", idx)
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Input
                      type="text"
                      placeholder="Add step... (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addArrayItem("carePlanSteps", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="text-lg h-12 bg-white/50 backdrop-blur-sm border-2 border-[rgba(101,67,33,0.2)] text-[rgba(101,67,33,1)] placeholder:text-[rgba(101,67,33,0.5)] focus-visible:border-[rgba(101,67,33,0.5)] focus-visible:ring-0 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        );

      case "copilotTutorial":
        return (
          <div className="flex flex-col lg:flex-row-reverse items-center lg:items-start gap-8 lg:gap-12 w-full">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex-1 space-y-6 lg:max-w-2xl w-full"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="space-y-4"
              >
                <h2 className="text-3xl lg:text-4xl font-bold text-[rgba(101,67,33,1)] leading-tight">
                  Agitation{" "}
                  <span className="text-5xl lg:text-7xl font-extrabold text-[rgba(101,67,33,1)] leading-tight">
                    Copilot
                  </span>
                </h2>
                <p className="text-xl text-[rgba(101,67,33,0.8)] leading-relaxed">
                  When agitation happens, tap "Log Episode" and we'll guide you
                  through it.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="bg-white/80 border border-[rgba(101,67,33,0.15)] rounded-lg p-6 space-y-4 shadow-sm">
                  <p className="text-base text-[rgba(101,67,33,0.8)] leading-relaxed">
                    The Copilot will suggest steps from your care plan and
                    interventions based on similar past episodes.
                  </p>
                  <p className="text-base text-[rgba(101,67,33,0.8)] leading-relaxed">
                    After logging, you can save the outcome (worked/didn't work)
                    to help improve future suggestions.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="pt-4"
              >
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex items-center gap-2 text-[rgba(101,67,33,0.8)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="text-lg">Continue</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </motion.div>

            {/* Right Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full lg:w-1/2 h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                {/* AI/Technology assistance image */}
                <Image
                  src="https://images.unsplash.com/photo-1621003464638-591ea8e6e1d6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGNhcmV8ZW58MHx8MHx8fDA%3D"
                  alt="AI assistance and technology support"
                  fill
                  className="object-cover opacity-80"
                  priority
                  unoptimized
                />
              </div>
            </motion.div>
          </div>
        );

      case "supportGroups":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 text-center"
          >
            <div className="space-y-6 w-full max-w-md">
              <Label className="text-3xl lg:text-4xl font-light text-[rgba(101,67,33,1)]">
                Join a support group (optional)
              </Label>
              <p className="text-sm text-[rgba(101,67,33,0.6)]">
                Connect with other caregivers
              </p>

              <div className="space-y-3">
                {SUPPORT_GROUPS.map((group) => (
                  <Button
                    key={group}
                    type="button"
                    variant={
                      formData.selectedGroups.includes(group)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleArrayItem("selectedGroups", group)}
                    className="w-full h-16 text-left justify-start bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] hover:bg-white hover:border-[rgba(101,67,33,0.3)] data-[variant=default]:bg-[rgba(101,67,33,0.05)] data-[variant=default]:border-[rgba(101,67,33,0.3)] rounded-lg text-base shadow-sm"
                  >
                    {group}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNext}
                  className="w-full h-16 text-left justify-start bg-white/80 border border-[rgba(101,67,33,0.15)] text-[rgba(101,67,33,1)] hover:bg-white hover:border-[rgba(101,67,33,0.3)] rounded-lg text-base shadow-sm"
                >
                  Skip for now
                </Button>
              </div>
            </div>
            {formData.selectedGroups.length > 0 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="mt-4 text-[rgba(101,67,33,0.6)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </motion.div>
        );

      case "success":
        return (
          <div className="flex flex-col lg:flex-row-reverse items-center lg:items-start gap-8 lg:gap-12 w-full">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex-1 space-y-8 lg:max-w-2xl w-full flex flex-col justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                  className="w-16 h-16 rounded-full bg-[rgba(101,67,33,0.1)] flex items-center justify-center"
                >
                  <span className="text-3xl text-[rgba(101,67,33,1)]">✓</span>
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-4xl lg:text-5xl font-semibold text-[rgba(101,67,33,1)] leading-[1.1] tracking-tight">
                    You're all set!
                  </h2>
                  <p className="text-xl lg:text-2xl text-[rgba(101,67,33,0.8)] leading-relaxed font-light max-w-xl">
                    Welcome to your dashboard. Let's start caring together.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="pt-6"
              >
                <Button
                  type="button"
                  onClick={() => setCurrentStep("complete")}
                  className="bg-[rgba(101,67,33,1)] text-white hover:bg-[rgba(101,67,33,0.9)] h-14 px-8 text-lg font-medium rounded-lg shadow-sm flex items-center gap-3 group transition-all"
                >
                  <span>Continue to Dashboard</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full lg:w-1/2 h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src="https://images.unsplash.com/photo-1580869318757-a6c605b061ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FyZXxlbnwwfHwwfHx8MA%3D%3D"
                  alt="Caregiving success"
                  fill
                  className="object-cover opacity-80"
                  priority
                  unoptimized
                />
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100vh",
      }}
    >
      {/* Dynamic Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentBackground} transition-all duration-1000 ease-in-out`}
      />

      {/* Animated Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[rgba(101,67,33,0.03)] rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[rgba(101,67,33,0.03)] rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-[rgba(101,67,33,0.03)] rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Back Arrow - Top Right */}
      {currentStepIndex > 0 && currentStep !== "success" && (
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="fixed top-6 right-6 z-50 text-[rgba(101,67,33,0.8)] hover:text-[rgba(101,67,33,1)] transition-colors disabled:opacity-50 bg-white/60 backdrop-blur-sm rounded-full p-2 hover:bg-white/80"
          style={{ zIndex: 9999 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {/* Logo on top left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="absolute top-6 left-6 z-10"
      >
        <div className="relative flex items-center gap-2 rounded-2xl p-3">
          <Image
            src="/logo.png"
            alt="Coco Logo"
            width={56}
            height={56}
            className="object-contain"
            priority
          />
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 min-h-screen">
        <div className="w-full max-w-3xl">
          {/* Progress Bar - Minimalist */}
          {currentStep !== "success" && (
            <div className="mb-12">
              <div className="w-full bg-white/40 rounded-full h-0.5 overflow-hidden">
                <div
                  className="bg-[rgba(101,67,33,1)] h-1 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Question Content */}
          <div className="min-h-[400px] flex items-center">
            <div
              key={currentStep}
              className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out"
            >
              {renderStep()}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
