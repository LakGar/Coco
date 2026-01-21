"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smile, Frown, Meh, Heart, Cloud, Moon, AlertCircle, Brain } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface MoodCardProps {
  teamId: string
  latestMood?: {
    id: string
    rating: "CALM" | "CONTENT" | "NEUTRAL" | "RELAXED" | "SAD" | "WITHDRAWN" | "TIRED" | "ANXIOUS" | "IRRITABLE" | "RESTLESS" | "CONFUSED"
    notes?: string | null
    observedAt: string
    loggedBy: {
      id: string
      name: string | null
      firstName: string | null
      lastName: string | null
    }
  } | null
  onMoodTracked?: () => void
}

const MOOD_CATEGORIES = [
  {
    title: "Positive / Neutral",
    moods: [
      { value: "CALM", label: "Calm", emoji: "😊", icon: Heart, color: "text-emerald-600", bgColor: "bg-emerald-50 hover:bg-emerald-100" },
      { value: "CONTENT", label: "Content", emoji: "🙂", icon: Smile, color: "text-blue-600", bgColor: "bg-blue-50 hover:bg-blue-100" },
      { value: "NEUTRAL", label: "Neutral", emoji: "😐", icon: Meh, color: "text-gray-600", bgColor: "bg-gray-50 hover:bg-gray-100" },
      { value: "RELAXED", label: "Relaxed", emoji: "😌", icon: Cloud, color: "text-teal-600", bgColor: "bg-teal-50 hover:bg-teal-100" },
    ],
  },
  {
    title: "Low / Withdrawn",
    moods: [
      { value: "SAD", label: "Sad", emoji: "😔", icon: Frown, color: "text-blue-600", bgColor: "bg-blue-50 hover:bg-blue-100" },
      { value: "WITHDRAWN", label: "Withdrawn", emoji: "😶", icon: Moon, color: "text-indigo-600", bgColor: "bg-indigo-50 hover:bg-indigo-100" },
      { value: "TIRED", label: "Tired", emoji: "😴", icon: Moon, color: "text-slate-600", bgColor: "bg-slate-50 hover:bg-slate-100" },
    ],
  },
  {
    title: "Agitated / Challenging",
    moods: [
      { value: "ANXIOUS", label: "Anxious", emoji: "😟", icon: AlertCircle, color: "text-amber-600", bgColor: "bg-amber-50 hover:bg-amber-100" },
      { value: "IRRITABLE", label: "Irritable", emoji: "😠", icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-50 hover:bg-orange-100" },
      { value: "RESTLESS", label: "Restless", emoji: "😣", icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50 hover:bg-red-100" },
      { value: "CONFUSED", label: "Confused", emoji: "😕", icon: Brain, color: "text-purple-600", bgColor: "bg-purple-50 hover:bg-purple-100" },
    ],
  },
] as const

// Flatten for easy lookup
const ALL_MOODS = MOOD_CATEGORIES.flatMap((cat) => cat.moods)

export function MoodCard({ teamId, latestMood, onMoodTracked }: MoodCardProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedRating, setSelectedRating] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [keepOpenForNotes, setKeepOpenForNotes] = React.useState(false)
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const handleTrackMood = () => {
    setDialogOpen(true)
    setSelectedRating(null)
    setNotes("")
    setSaved(false)
    setKeepOpenForNotes(false)
  }

  const handleMoodSelect = async (rating: string) => {
    if (saving) return
    
    setSelectedRating(rating)
    setSaving(true)
    
    try {
      const response = await fetch(`/api/teams/${teamId}/moods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
          notes: null, // Auto-save without notes first
          observedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Mood save error:", errorData)
        throw new Error(errorData.details || errorData.error || "Failed to save mood")
      }

      setSaved(true)
      onMoodTracked?.()
      
      // Close modal after a brief delay, unless user wants to add notes
      if (!keepOpenForNotes) {
        setTimeout(() => {
          setDialogOpen(false)
          setSelectedRating(null)
          setNotes("")
          setSaved(false)
          setKeepOpenForNotes(false)
        }, 800)
      }
    } catch (error) {
      console.error("Error saving mood:", error)
      toast.error("Failed to save mood")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedRating || !notes.trim()) {
      // If no notes, just close
      setDialogOpen(false)
      setSelectedRating(null)
      setNotes("")
      setSaved(false)
      setKeepOpenForNotes(false)
      return
    }

    setSaving(true)
    try {
      // Update the mood entry with notes
      const response = await fetch(`/api/teams/${teamId}/moods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: selectedRating,
          notes: notes.trim(),
          observedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save notes")
      }

      setDialogOpen(false)
      setSelectedRating(null)
      setNotes("")
      setSaved(false)
      setKeepOpenForNotes(false)
      onMoodTracked?.()
    } catch (error) {
      console.error("Error saving notes:", error)
      toast.error("Failed to save notes")
    } finally {
      setSaving(false)
    }
  }

  const latestMoodOption = latestMood
    ? ALL_MOODS.find((opt) => opt.value === latestMood.rating)
    : null

  return (
    <>
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3 }}
      >
        <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium mb-1">How is their mood right now?</h3>
                {latestMood && latestMoodOption ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-base">{latestMoodOption.emoji}</span>
                    <span className="truncate">
                      {latestMoodOption.label} • {new Date(latestMood.observedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not tracked today</p>
                )}
              </div>
              <Button
                onClick={handleTrackMood}
                size="sm"
                className="shrink-0 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Track
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Track Mood</DialogTitle>
            <DialogDescription>
              How is their mood right now?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {MOOD_CATEGORIES.map((category) => (
              <div key={category.title} className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {category.title}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {category.moods.map((option) => {
                    const isSelected = selectedRating === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleMoodSelect(option.value)}
                        disabled={saving}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all relative ${
                          isSelected
                            ? saved
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-muted/50 border-border"
                            : "border-border/50 hover:border-border hover:bg-muted/30"
                        } ${saving && !isSelected ? "opacity-50" : ""}`}
                      >
                        {saved && isSelected && (
                          <span className="absolute top-1 right-1 text-emerald-600 text-xs">✓</span>
                        )}
                        <span className="text-2xl">{option.emoji}</span>
                        <span className={`text-xs font-medium text-center ${
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {saved && selectedRating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mood-notes">Add context (optional)</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setKeepOpenForNotes(true)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {keepOpenForNotes ? "Close" : "Add notes"}
                  </button>
                </div>
                {keepOpenForNotes && (
                  <>
                    <Textarea
                      id="mood-notes"
                      placeholder="Add any observations or context..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDialogOpen(false)
                          setSelectedRating(null)
                          setNotes("")
                          setSaved(false)
                          setKeepOpenForNotes(false)
                        }}
                        disabled={saving}
                      >
                        Done
                      </Button>
                      {notes.trim() && (
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save notes"}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {!saved && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

