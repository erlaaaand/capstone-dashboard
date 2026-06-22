import type { Metadata } from "next"

import { AppSidebar } from "@/src/components/dashboard/app-sidebar"
import { ChartAreaInteractive } from "@/src/components/dashboard/chart-area-interactive"
import { SectionCards } from "@/src/components/dashboard/section-cards"
import { SiteHeader } from "@/src/components/dashboard/site-header"
import { PredictionsTable } from "@/src/components/dashboard/prediction-table"
import { DatasetsTable } from "@/src/components/dashboard/datasets-table"
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs"

export const metadata: Metadata = {
  title: "Dashboard — Durian Classifier Admin",
}

export default function DashboardPage() {
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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

              {/* ── Kartu ringkasan ── */}
              <SectionCards />

              {/* ── Grafik tren prediksi ── */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>

              {/* ── Tabel data (tab: Prediksi | Dataset) ── */}
              <div className="px-4 lg:px-6">
                <Tabs defaultValue="predictions">
                  <TabsList className="mb-4">
                    <TabsTrigger value="predictions">Prediksi</TabsTrigger>
                    <TabsTrigger value="datasets">Dataset</TabsTrigger>
                  </TabsList>

                  <TabsContent value="predictions">
                    <PredictionsTable />
                  </TabsContent>

                  <TabsContent value="datasets">
                    <DatasetsTable />
                  </TabsContent>
                </Tabs>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}