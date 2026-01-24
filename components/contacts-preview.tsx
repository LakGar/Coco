"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, AlertCircle, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTeamStore } from "@/store/use-team-store"

interface Contact {
  id: string
  type: string
  name: string
  phone?: string | null
  email?: string | null
  isPrimary?: boolean
}

interface ContactsPreviewProps {
  contacts?: Contact[]
  onViewContacts?: () => void
}

export function ContactsPreview({
  contacts = [],
  onViewContacts,
}: ContactsPreviewProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion
  const { activeTeam } = useTeamStore()

  const handleViewContacts = () => {
    if (onViewContacts) {
      onViewContacts()
    } else {
      router.push("/dashboard/contacts")
    }
  }

  // Check if contacts are set up
  const hasContacts = contacts.length > 0
  const hasEmergencyContact = contacts.some(
    (c) => c.type === "EMERGENCY_CONTACT"
  )
  const needsSetup = !hasEmergencyContact

  if (!activeTeam) {
    return null
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-medium">Emergency Contacts</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewContacts}
              className="text-xs h-7 px-3 border-border/50 hover:bg-muted/50"
            >
              {hasContacts ? "View all" : "Set up"}
            </Button>
          </div>

          {needsSetup ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Setup Required
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Add emergency contacts and important phone numbers for quick
                    access.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewContacts}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add Emergency Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {contacts
                .filter((c) => c.type === "EMERGENCY_CONTACT")
                .slice(0, 3)
                .map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact.name}
                        {contact.isPrimary && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Primary)
                          </span>
                        )}
                      </p>
                      {contact.phone && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              {contacts.filter((c) => c.type === "EMERGENCY_CONTACT").length >
                3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewContacts}
                  className="w-full text-xs"
                >
                  View all contacts
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
