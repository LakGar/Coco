"use client"

import * as React from "react"
import {
  AudioWaveform,
  User,
  BookOpen,
  Bot,
  Command,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  House,
  List,
  Users,
  FileText,
  FileUser,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"

import { NavMain } from "@/components/nav-main"
import { NavDocuments } from "@/components/nav-documents"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Home from "@/app/page"
// This is sample data.


const data = {
  teams: [
    {
      name: "John's Care Team",
      logo: User,
      plan: "Free",
    },
    
  ],
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: House,
      isActive: true,
      
    },
    {
      title: "Tasks",
      url: "/dashboard/tasks",
      icon: List,
      items: [
        {
          title: "Add Task",
          url: "#",
        },
        
      ],
    },
    {
      title: "Care Team",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Add Team Member",
          url: "#",
        },
        {
          title: "Team Permissions",
          url: "#",
        },

        {
          title: "Audit Logs",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  Documents: [
    {
      name: "John's Care Plan",
      url: "#",
      icon: FileText,
    },
    {
      name: "John's Medical History",
      url: "#",
      icon: FileUser,
    },
    {
      name: "John's Medications",
      url: "#",
      icon: FileText,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: clerkUser, isLoaded } = useUser()

  // Format user data for NavUser component
  const user = React.useMemo(() => {
    if (!clerkUser || !isLoaded) {
      return null
    }
    
    return {
      name: clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || "User",
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      avatar: clerkUser.imageUrl || "",
    }
  }, [clerkUser, isLoaded])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments documents={data.Documents} />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser user={user} />
        ) : (
          <div className="px-2 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Loading user...
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
