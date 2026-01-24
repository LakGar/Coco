"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTeamStore } from "@/store/use-team-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function NotificationBell() {
  const router = useRouter()
  const { activeTeam } = useTeamStore()
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    if (!activeTeam) {
      setUnreadCount(0)
      return
    }

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/teams/${activeTeam.id}/notifications`)
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching notifications:', error)
        }
      }
    }

    fetchNotifications()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [activeTeam])

  const handleClick = () => {
    router.push('/dashboard/notifications')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-8 w-8"
      onClick={handleClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs text-white"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
