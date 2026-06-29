// src/app/dashboard/dataset/page.tsx

import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { fetchServer } from "@/src/core/api/server-client"
import { PaginatedPredictions } from "@/src/core/types/prediction.types"
import { PredictionCardGrid } from "@/src/components/kurasi-ai/prediction-card-grid"
import { ExportButton } from "@/src/components/kurasi-ai/export-button"
import { Button } from "@/src/components/ui/button"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Dataset Terverifikasi",
  description: "Kelola dan ekspor data gambar durian yang telah dikurasi.",
}

const ITEMS_PER_PAGE = 20

export default async function DatasetPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  // 1. Ambil parameter page dari URL (?page=1)
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))

  let data: PaginatedPredictions
  let fetchError: string | null = null

  try {
    // 2. Fetch data dari server dengan isCurated=true
    data = await fetchServer<PaginatedPredictions>(
      `/admin/predictions?page=${page}&limit=${ITEMS_PER_PAGE}&isCurated=true`
    )
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Gagal memuat dataset terverifikasi"
    data = { data: [], total: 0, page, limit: ITEMS_PER_PAGE, totalPages: 0 }
  }

  const hasPrevPage = page > 1
  const hasNextPage = page < data.totalPages

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dataset Terverifikasi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kumpulan data gambar dan hasil prediksi yang telah melalui proses kurasi. Siap diekspor untuk proses retraining model AI.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-4">
          <ExportButton />
        </div>
      </div>

      {/* ── Error State ── */}
      {!fetchError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Menampilkan {data.data.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(page * ITEMS_PER_PAGE, data.total)} dari total <span className="font-bold text-primary">{data.total}</span> data siap pakai.
            </p>
          </div>

          <PredictionCardGrid predictions={data.data} mode="dataset" />
        </div>
      )}

      {/* ── Konten Utama ── */}
      {!fetchError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Menampilkan {data.data.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(page * ITEMS_PER_PAGE, data.total)} dari total <span className="font-bold text-primary">{data.total}</span> data siap pakai.
            </p>
          </div>

          {/* Menampilkan Grid Kartu Prediksi */}
          <PredictionCardGrid predictions={data.data} />
        </div>
      )}

      {/* ── Kontrol Paginasi ── */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {hasPrevPage ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/dataset?page=${page - 1}`}>
                <ChevronLeftIcon className="size-4 mr-1" /> Sebelumnya
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeftIcon className="size-4 mr-1" /> Sebelumnya
            </Button>
          )}

          <span className="px-4 text-sm font-medium text-muted-foreground">
            {page} / {data.totalPages}
          </span>

          {hasNextPage ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/dataset?page=${page + 1}`}>
                Berikutnya <ChevronRightIcon className="size-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Berikutnya <ChevronRightIcon className="size-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}