"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/src/components/ui/separator"
import { SidebarTrigger } from "@/src/components/ui/sidebar"

/** Hanya 2 menu sesuai spesifikasi: Dashboard dan Kurasi AI */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/kurasi-ai": "Kurasi AI",
}

function resolveTitle(pathname: string): string {
  // Cari kecocokan persis dulu
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]

  // Fallback: ambil segmen terakhir dan kapitalisasi
  const segments = pathname.split("/").filter(Boolean)
  const last = segments[segments.length - 1] ?? "Dashboard"
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ")
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = resolveTitle(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}