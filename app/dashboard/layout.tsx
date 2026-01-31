import React from "react";
import { OnboardingGuard } from "./onboarding-guard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderUser } from "@/components/header-user";
import { NightlyJournalPrompt } from "@/components/nightly-journal-prompt";
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import { NotificationDropdown } from "@/components/notification-dropdown";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="relative overflow-hidden">
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background/80 backdrop-blur-md border-b border-border/40 overflow-x-hidden">
            <div className="flex items-center justify-between gap-2 px-4 w-full min-w-0">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <div className="flex items-center gap-2">
                <NotificationDropdown variant="header" />
                <HeaderUser />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-hidden w-full">
            <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
            <NightlyJournalPrompt />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </OnboardingGuard>
  );
}
