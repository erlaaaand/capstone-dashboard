"use client"

import * as React from "react"
import { AdminPredictionService } from "@/src/core/services/prediction.service"
import { Prediction } from "@/src/core/types/prediction.types"
import { PredictionCardGrid } from "@/src/components/kurasi-ai/prediction-card-grid"
import { ExportButton } from "@/src/components/kurasi-ai/export-button"
import { Loader2Icon, AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/src/components/ui/button"

export default function DatasetPage() {
  const [predictions, setPredictions] = React.useState<Prediction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDataset = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Memanggil API dengan filter isCurated: true
      const response = await AdminPredictionService.list({
        page: 1,
        limit: 50, // Sesuaikan limit sesuai kebutuhan
        isCurated: true, // KUNCI: Hanya ambil data yang sudah divalidasi admin
      })
      setPredictions(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dataset terverifikasi")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDataset()
  }, [fetchDataset])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dataset Terverifikasi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kumpulan data gambar dan hasil prediksi yang telah melalui proses kurasi. Siap diekspor untuk proses retraining model AI.
          </p>
        </div>
        <div className="flex-shrink-0">
          <ExportButton />
        </div>
      </div>

      {/* Konten Utama */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2Icon className="size-8 animate-spin mb-4" />
          <p>Memuat dataset...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-destructive border-2 border-dashed border-destructive/20 rounded-xl bg-destructive/5">
          <AlertCircleIcon className="size-8 mb-4" />
          <p className="font-medium">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDataset} 
            className="mt-4 gap-2 bg-background"
          >
            <RefreshCwIcon className="size-4" />
            Coba muat ulang
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Total <span className="font-bold text-primary">{predictions.length}</span> data siap pakai.
            </p>
          </div>
          {/* Menampilkan Grid Kartu Prediksi */}
          <PredictionCardGrid predictions={predictions} />
        </div>
      )}
    </div>
  )
}