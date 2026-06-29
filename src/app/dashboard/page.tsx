import type { Metadata } from "next"

import { ChartAreaInteractive } from "@/src/components/dashboard/chart-area-interactive"
import { SectionCards } from "@/src/components/dashboard/section-cards"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan kondisi sistem klasifikasi varietas durian secara sekilas.",
}

/**
 * Halaman utama Dashboard — ringkasan kondisi sistem.
 * Sidebar dan header sudah dirender oleh dashboard/layout.tsx.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* ── Kartu ringkasan ── */}
      <SectionCards />

      {/* ── Grafik tren prediksi ── */}
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </div>
  )
}