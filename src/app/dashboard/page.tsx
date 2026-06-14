import { AppSidebar } from "@/src/components/dashboard/app-sidebar"
import { ChartAreaInteractive } from "@/src/components/dashboard/chart-area-interactive"
import { DataTable } from "@/src/components/dashboard/data-table"
import { SectionCards } from "@/src/components/dashboard/section-cards"
import { SiteHeader } from "@/src/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar"
import { TooltipProvider } from "@/src/components/ui/tooltip"

import data from "./data.json"

export default function Page() {
  return (
    <TooltipProvider delayDuration={0}>
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
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
                <DataTable data={data} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}