"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const router = useRouter()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0
          
          return (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
                <div className="flex items-center w-full">
                  {/* Icon - clickable to toggle dropdown if has sub items, otherwise just displays */}
                  {item.icon && hasSubItems ? (
              <CollapsibleTrigger asChild>
                      <button
                        className="p-2 hover:bg-sidebar-accent rounded transition-colors"
                        aria-label="Toggle submenu"
                      >
                        <item.icon className="h-4 w-4" />
                      </button>
                    </CollapsibleTrigger>
                  ) : item.icon ? (
                    <div className="p-2">
                      <item.icon className="h-4 w-4" />
                    </div>
                  ) : null}
                  
                  {/* Main link - clickable text */}
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => {
                      if (item.url && item.url !== '#') {
                        router.push(item.url)
                      }
                    }}
                    className="flex-1"
                    asChild={false}
                  >
                    <span className="flex-1 text-left">{item.title}</span>
                    {hasSubItems && (
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  )}
                </SidebarMenuButton>
                </div>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={subItem.url}>
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
