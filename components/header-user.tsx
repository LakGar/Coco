"use client"

import * as React from "react"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"
import { useClerk, useUser } from "@clerk/nextjs"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface PrismaUser {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string | null
}

export function HeaderUser() {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [prismaUser, setPrismaUser] = React.useState<PrismaUser | null>(null)
  const [loadingUser, setLoadingUser] = React.useState(true)
  const [imageUrlKey, setImageUrlKey] = React.useState(0)

  // Fetch user from Prisma
  React.useEffect(() => {
    const fetchUser = async () => {
      if (!isLoaded || !clerkUser) {
        setLoadingUser(false)
        return
      }

      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setPrismaUser(data.user)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching user profile:', error)
        }
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUser()
  }, [isLoaded, clerkUser])

  // Track imageUrl changes to force refresh
  React.useEffect(() => {
    if (prismaUser?.imageUrl) {
      setImageUrlKey(prev => prev + 1)
    }
  }, [prismaUser?.imageUrl])

  // Format user data
  const user = React.useMemo(() => {
    if (!clerkUser || !isLoaded || loadingUser) {
      return null
    }
    
    // Use Prisma imageUrl if available, fallback to Clerk
    const imageUrl = prismaUser?.imageUrl || clerkUser.imageUrl || ""
    
    // Add cache-busting query parameter based on imageUrl changes
    const avatarUrl = imageUrl
      ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_v=${imageUrlKey}` 
      : ""
    
    // Use Prisma name if available, fallback to Clerk
    const name = prismaUser?.name || 
      (prismaUser?.firstName && prismaUser?.lastName 
        ? `${prismaUser.firstName} ${prismaUser.lastName}` 
        : prismaUser?.firstName || prismaUser?.lastName) ||
      clerkUser.fullName || 
      clerkUser.firstName || 
      clerkUser.emailAddresses[0]?.emailAddress || 
      "User"
    
    const email = prismaUser?.email || clerkUser.emailAddresses[0]?.emailAddress || ""
    
    return {
      name,
      email,
      imageUrl: avatarUrl,
    }
  }, [clerkUser, isLoaded, loadingUser, prismaUser, imageUrlKey])

  if (!user) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    )
  }

  const handleSignOut = () => {
    signOut()
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8" key={`header-avatar-${user.imageUrl}`}>
            <AvatarImage src={user.imageUrl} alt={user.name} key={`header-img-${user.imageUrl}`} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg" key={`header-dropdown-avatar-${user.imageUrl}`}>
              <AvatarImage src={user.imageUrl} alt={user.name} key={`header-dropdown-img-${user.imageUrl}`} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

