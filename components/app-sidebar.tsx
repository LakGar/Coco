"use client";

import * as React from "react";
import {
  Settings2,
  House,
  List,
  Pill,
  Users,
  FileText,
  FileUser,
  Repeat,
  Phone,
  Heart,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useTeamStore } from "@/store/use-team-store";

import { NavMain } from "@/components/nav-main";
import { NavDocuments } from "@/components/nav-documents";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

interface PrismaUser {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: clerkUser, isLoaded } = useUser();
  const { loadTeams, activeTeam } = useTeamStore();
  const [prismaUser, setPrismaUser] = React.useState<PrismaUser | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  // Load teams when component mounts
  React.useEffect(() => {
    if (isLoaded && clerkUser) {
      loadTeams();
    }
  }, [isLoaded, clerkUser, loadTeams]);

  // Fetch user from Prisma
  React.useEffect(() => {
    const fetchUser = async () => {
      if (!isLoaded || !clerkUser) {
        setLoadingUser(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setPrismaUser(data.user);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching user profile:", error);
        }
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [isLoaded, clerkUser]);

  // Track imageUrl changes to force refresh
  const [imageUrlKey, setImageUrlKey] = React.useState(0);

  React.useEffect(() => {
    if (prismaUser?.imageUrl) {
      setImageUrlKey((prev) => prev + 1);
    }
  }, [prismaUser?.imageUrl]);

  // Format user data for NavUser component
  const user = React.useMemo(() => {
    if (!clerkUser || !isLoaded || loadingUser) {
      return null;
    }

    // Use Prisma imageUrl if available, fallback to Clerk
    const imageUrl = prismaUser?.imageUrl || clerkUser.imageUrl || "";

    // Add cache-busting query parameter based on imageUrl changes
    const avatarUrl = imageUrl
      ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}_v=${imageUrlKey}`
      : "";

    // Use Prisma name if available, fallback to Clerk
    const name =
      prismaUser?.name ||
      (prismaUser?.firstName && prismaUser?.lastName
        ? `${prismaUser.firstName} ${prismaUser.lastName}`
        : prismaUser?.firstName || prismaUser?.lastName) ||
      clerkUser.fullName ||
      clerkUser.firstName ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "User";

    const email =
      prismaUser?.email || clerkUser.emailAddresses[0]?.emailAddress || "";

    return {
      name,
      email,
      avatar: avatarUrl,
    };
  }, [clerkUser, isLoaded, loadingUser, prismaUser, imageUrlKey]);

  // Dynamic nav items based on active team
  const navMain = React.useMemo(
    () => [
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
        title: "Medications",
        url: "/dashboard/medications",
        icon: Pill,
      },
      {
        title: "Routines",
        url: "/dashboard/routines",
        icon: Repeat,
        items: [
          {
            title: "Add Routine",
            url: "#",
          },
        ],
      },
      {
        title: "Notes",
        url: "/dashboard/notes",
        icon: FileText,
      },
      {
        title: "Contacts",
        url: "/dashboard/contacts",
        icon: Phone,
      },
      {
        title: "Caregiver Burden",
        url: "/dashboard/caregiver-burden",
        icon: Heart,
      },
      {
        title: "Care Team",
        url: "/dashboard/team",
        items: [
          {
            title: "Members",
            url: "/dashboard/team",
          },
          {
            title: "Permissions",
            url: "/dashboard/team/permissions",
          },
        ],
        icon: Users,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings2,
      },
    ],
    []
  );

  // Dynamic documents based on active team
  // Only show documents if we have a valid patient name (not a physician name)
  const documents = React.useMemo(() => {
    if (!activeTeam) {
      return [];
    }

    // Use team name to extract patient name, or use patientName if available
    // Team name format is typically "Patient's Care Team"
    const patientName =
      activeTeam.patientName ||
      activeTeam.name
        ?.replace("'s Care Team", "")
        .replace("'s Care Team", "") ||
      null;

    if (!patientName) {
      return [];
    }

    return [
      {
        name: `${patientName}'s Care Plan`,
        url: "#",
        icon: FileText,
      },
      {
        name: `${patientName}'s Medical History`,
        url: "#",
        icon: FileUser,
      },
      {
        name: `${patientName}'s Medications`,
        url: "#",
        icon: FileText,
      },
    ];
  }, [activeTeam]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {documents.length > 0 && <NavDocuments documents={documents} />}
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
  );
}
