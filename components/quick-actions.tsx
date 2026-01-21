"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, FileText, ClipboardList } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickActionsProps {
  onFillJournal?: () => void
  onAddTask?: () => void
  onAddNote?: () => void
  onViewCarePlan?: () => void
}

export function QuickActions({
  onFillJournal,
  onAddTask,
  onAddNote,
  onViewCarePlan,
}: QuickActionsProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Removed - now handled by WelcomeHeader
  return null
}

