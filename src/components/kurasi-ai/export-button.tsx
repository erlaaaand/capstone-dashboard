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

      // Fix: validasi blob sebelum membuat object URL
      if (!(blob instanceof Blob)) {
        throw new Error("Respons server bukan file yang valid")
      }

      if (blob.size === 0) {
        throw new Error("Dataset kosong — tidak ada data untuk diunduh")
      }

      // Fix: buat filename dengan timestamp yang lebih rapi (tanpa 'T' dan timezone)
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10) // "2025-06-30"
      const filename = `dataset-durian-terverifikasi-${dateStr}.zip`

      // Fix: pastikan blob memiliki MIME type yang benar untuk ZIP
      const downloadBlob = blob.type
        ? blob
        : new Blob([blob], { type: "application/zip" })

      const url = window.URL.createObjectURL(downloadBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()

      // Fix: delay sebelum cleanup agar browser punya waktu memproses download
      setTimeout(() => {
        link.remove()
        window.URL.revokeObjectURL(url)
      }, 1000)

      // Tampilkan ukuran file di toast sukses
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2)
      toast.success(`Export berhasil — ${fileSizeMB} MB`, {
        id: toastId,
        description: `File disimpan sebagai ${filename}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pastikan ada data terverifikasi atau koneksi stabil."
      toast.error("Gagal mengekspor dataset", {
        id: toastId,
        description: message,
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
      {isExporting ? (
        <LoaderIcon className="size-3.5 animate-spin" />
      ) : (
        <DownloadIcon className="size-3.5" />
      )}
      {isExporting ? "Mengekspor..." : "Export Dataset ZIP"}
    </Button>
  )
}