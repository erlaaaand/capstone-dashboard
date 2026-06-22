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
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  CommandIcon,
} from "lucide-react"

import { useCurrentUser } from "@/src/core/hooks/use-current-user"
import { AuthUser } from "@/src/core/types/auth.types"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Lifecycle",
    url: "/dashboard/lifecycle",
    icon: <ListIcon />,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: <ChartBarIcon />,
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: <FolderIcon />,
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: <UsersIcon />,
  },
]

const navClouds = [
  {
    title: "Capture",
    icon: <CameraIcon />,
    isActive: true,
    url: "/dashboard/capture",
    items: [
      { title: "Active Proposals", url: "/dashboard/capture/active" },
      { title: "Archived", url: "/dashboard/capture/archived" },
    ],
  },
  {
    title: "Proposal",
    icon: <FileTextIcon />,
    url: "/dashboard/proposal",
    items: [
      { title: "Active Proposals", url: "/dashboard/proposal/active" },
      { title: "Archived", url: "/dashboard/proposal/archived" },
    ],
  },
  {
    title: "Prompts",
    icon: <FileTextIcon />,
    url: "/dashboard/prompts",
    items: [
      { title: "Active Proposals", url: "/dashboard/prompts/active" },
      { title: "Archived", url: "/dashboard/prompts/archived" },
    ],
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: <Settings2Icon />,
  },
  {
    title: "Get Help",
    url: "/dashboard/help",
    icon: <CircleHelpIcon />,
  },
  {
    title: "Search",
    url: "/dashboard/search",
    icon: <SearchIcon />,
  },
]

const documents = [
  {
    name: "Data Library",
    url: "/dashboard/data-library",
    icon: <DatabaseIcon />,
  },
  {
    name: "Reports",
    url: "/dashboard/reports",
    icon: <FileChartColumnIcon />,
  },
  {
    name: "Word Assistant",
    url: "/dashboard/word-assistant",
    icon: <FileIcon />,
  },
]

/** Fallback user saat data belum tersedia dari localStorage */
const FALLBACK_USER: AuthUser = {
  id: "",
  email: "",
  fullName: "Administrator",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Ambil data user yang sudah di-persist saat login
  const currentUser = useCurrentUser()
  const user: AuthUser = currentUser ?? FALLBACK_USER

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
        {/* Teruskan AuthUser langsung — NavUser sudah mengharapkan tipe ini */}
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}