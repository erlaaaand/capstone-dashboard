import type { Metadata } from "next"

import { AppSidebar } from "@/src/components/dashboard/app-sidebar"
import { SiteHeader } from "@/src/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar"

export const metadata: Metadata = {
  title: {
    template: "%s — Durian Classifier Admin",
    default: "Dashboard — Durian Classifier Admin",
  },
}

/**
 * Layout bersama untuk semua rute /dashboard/*.
 * Menampung AppSidebar dan SiteHeader agar tidak perlu duplikasi di setiap page.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
