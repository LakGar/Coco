"use client"

import { motion, useReducedMotion } from "framer-motion"
import { MessageSquare, Shield, Mail, Calendar, Crown, UserCheck, UserCog, Check, Plus } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import Image from "next/image"

interface TeamMemberCardProps {
  member: {
    id: string
    name: string
    email: string
    image?: string
    role: string
    isAdmin: boolean
    accessLevel: string
    joinedAt: string
    isTeamCreator?: boolean
  }
  backgroundImage?: string
  enableAnimations?: boolean
  className?: string
  onMessage?: (member: any) => void
  onPermissions?: (member: any) => void
  canManagePermissions?: boolean
  currentUserId?: string
}

const backgroundImages = [
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=600&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&auto=format&q=80",
]

export function TeamMemberCard({
  member,
  backgroundImage,
  enableAnimations = true,
  className,
  onMessage,
  onPermissions,
  canManagePermissions = false,
  currentUserId,
}: TeamMemberCardProps) {
  const [hovered, setHovered] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = enableAnimations && !shouldReduceMotion

  // Use member's profile image as background, fallback to random image
  const bgImage = backgroundImage || member.image || backgroundImages[parseInt(member.id.slice(-1)) % backgroundImages.length]

  const getRoleDisplay = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = () => {
    if (member.role === 'PATIENT') {
      return 'default'
    }
    if (member.isAdmin) {
      return 'secondary'
    }
    return 'outline'
  }

  const containerVariants = {
    rest: { 
      scale: 1,
      y: 0,
    },
    hover: shouldAnimate ? { 
      scale: 1.02, 
      y: -4,
      transition: { 
        type: "spring" as const, 
        stiffness: 400, 
        damping: 28,
        mass: 0.6,
      }
    } : {},
  }

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1 },
  }

  const contentVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 15,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  }

  const handleMessage = () => {
    if (onMessage) {
      onMessage(member)
    } else {
      toast.info(`Opening message thread with ${member.name}`)
    }
  }

  const handlePermissions = (data: { member: any; action: string }) => {
    if (onPermissions) {
      onPermissions(data)
    } else {
      toast.info(`${data.action} for ${data.member.name}`)
    }
  }

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      className={cn(
        "relative w-full bg-card rounded-2xl border border-border/40 text-card-foreground overflow-hidden shadow-lg shadow-black/5 ",
        "dark:shadow-black/20 p-2 ",
        className
      )}
    >
      {/* Profile Picture - Top Section */}
      <motion.div
        variants={imageVariants}
        className="relative w-full aspect-[4/4] overflow-hidden bg-muted rounded-lg"
      >
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/60">
              {getInitials(member.name)}
            </span>
          </div>
        )}
        {/* Initials Badge - Top Right */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="absolute top-3 right-3 z-10"
        >
          <div className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md border-2 border-background/80 flex items-center justify-center shadow-lg">
            <span className="text-xs font-bold text-foreground">
              {getInitials(member.name)}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Content Section */}
      <motion.div 
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className="p-6 space-y-4"
      >
        {/* Name with Verification */}
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">
            {member.name}
          </h2>
          {(member.isAdmin || member.role === 'PATIENT') && (
            <motion.div
              whileHover={{ 
                scale: 1.1,
                transition: { type: "spring" as const, stiffness: 400, damping: 20 }
              }}
            >
              {member.isAdmin ? (
                <Crown className="h-5 w-5 text-yellow-500 shrink-0" />
              ) : (
                <Check className="h-5 w-5 text-green-500 shrink-0" />
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Role/Profession */}
        <motion.p 
          variants={itemVariants}
          className="text-sm text-muted-foreground"
        >
          {getRoleDisplay(member.role)}
          {member.role !== 'PATIENT' }
        </motion.p>

        {/* Metrics Row */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-4 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            <span className="text-xs truncate max-w-[120px]">{member.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">
              {new Date(member.joinedAt).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </motion.div>

        {/* Action Buttons - Hide for current user */}
        {currentUserId && member.id !== currentUserId && (
          <motion.div 
            variants={itemVariants}
            className="flex gap-2 pt-2"
          >
            <motion.div
              whileHover={{ 
                scale: 1.02,
                transition: { type: "spring" as const, stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.98 }}
              className={canManagePermissions ? "flex-1" : "w-full"}
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleMessage}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            </motion.div>
            {canManagePermissions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ 
                      scale: 1.02,
                      transition: { type: "spring" as const, stiffness: 400, damping: 25 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Permissions
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Access Level</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handlePermissions({ member, action: `Setting ${member.name} to Full Access` })}
                    disabled={member.accessLevel === 'FULL'}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Full Access
                    {member.accessLevel === 'FULL' && (
                      <span className="ml-auto text-xs text-muted-foreground">Current</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handlePermissions({ member, action: `Setting ${member.name} to Read Only` })}
                    disabled={member.accessLevel === 'READ_ONLY'}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Read Only
                    {member.accessLevel === 'READ_ONLY' && (
                      <span className="ml-auto text-xs text-muted-foreground">Current</span>
                    )}
                  </DropdownMenuItem>
                  {member.isAdmin && !member.isTeamCreator && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handlePermissions({ member, action: `Removing admin status from ${member.name}` })}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Remove Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  {!member.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handlePermissions({ member, action: `Making ${member.name} an Admin` })}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Make Admin
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

