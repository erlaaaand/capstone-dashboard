"use client"

import * as React from "react"

import { NavDocuments } from "@/src/components/dashboard/nav-documents"
import { NavMain } from "@/src/components/dashboard/nav-main"
import { NavSecondary } from "@/src/components/dashboard/nav-secondary"
import { NavUser } from "@/src/components/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon, Settings2Icon, CircleHelpIcon, SearchIcon, CameraIcon, FileTextIcon } from "lucide-react"

import { useCurrentUser } from "@/src/core/hooks/use-current-user"
import { AuthUser } from "@/src/core/types/auth.types"

const FALLBACK_USER: AuthUser = {
  id: "unknown",
  email: "admin@example.com",
  fullName: "Administrator",
}

const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
  { title: "Lifecycle", url: "/dashboard/lifecycle", icon: <ListIcon /> },
  { title: "Analytics", url: "/dashboard/analytics", icon: <ChartBarIcon /> },
  { title: "Projects", url: "/dashboard/projects", icon: <FolderIcon /> },
  { title: "Team", url: "/dashboard/team", icon: <UsersIcon /> },
]

const navSecondary = [
  { title: "Settings", url: "/dashboard/settings", icon: <Settings2Icon /> },
  { title: "Get Help", url: "/dashboard/help", icon: <CircleHelpIcon /> },
  { title: "Search", url: "/dashboard/search", icon: <SearchIcon /> },
]

const documents = [
  { name: "Predictions", url: "/dashboard/predictions", icon: <DatabaseIcon /> },
  { name: "Datasets", url: "/dashboard/datasets", icon: <FileChartColumnIcon /> },
  { name: "Word Assistant", url: "/dashboard/word-assistant", icon: <FileIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useCurrentUser()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser ?? FALLBACK_USER} />
      </SidebarFooter>
    </Sidebar>
  )
}