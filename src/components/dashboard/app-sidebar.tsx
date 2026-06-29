"use client"

import * as React from "react"

import { NavMain } from "@/src/components/dashboard/nav-main"
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
  ScanSearchIcon,
  LeafIcon,
  DatabaseIcon
} from "lucide-react"

import { useCurrentUser } from "@/src/core/hooks/use-current-user"
import { AuthUser } from "@/src/core/types/auth.types"

/** Menu navigasi utama — persis 2 sesuai spesifikasi */
const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Kurasi AI",
    url: "/dashboard/kurasi-ai",
    icon: <ScanSearchIcon />,
  },
  {
    title: "Dataset",
    url: "/dashboard/dataset",
    icon: <DatabaseIcon />,
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
                <LeafIcon className="size-5! text-green-500" />
                <span className="text-base font-semibold">Durian Classifier</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        {/* Teruskan AuthUser langsung — NavUser sudah mengharapkan tipe ini */}
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}