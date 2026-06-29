"use client"

import * as React from "react"
import { toast } from "sonner"
import { DownloadIcon, LoaderIcon } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { AdminPredictionService } from "@/src/core/services/prediction.service"

export function ExportButton() {
  const [isExporting, setIsExporting] = React.useState(false)

  async function handleExport() {
    setIsExporting(true)
    const toastId = toast.loading("Menyiapkan dataset... Ini mungkin memakan waktu.")
    
    try {
      const blob = await AdminPredictionService.exportDataset()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `dataset-durian-terverifikasi-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Export berhasil diselesaikan", { id: toastId })
    } catch (err) {
      toast.error("Gagal mengekspor dataset", { 
        id: toastId,
        description: "Pastikan ada data terverifikasi atau koneksi stabil."
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting} 
      variant="outline" 
      size="sm" 
      className="gap-2 shadow-xs bg-background"
    >
      {isExporting ? <LoaderIcon className="size-3.5 animate-spin" /> : <DownloadIcon className="size-3.5" />}
      Export Dataset ZIP
    </Button>
  )
}