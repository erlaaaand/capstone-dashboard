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
  description:
    "Kelola dan ekspor data gambar durian yang telah dikurasi.",
}

const ITEMS_PER_PAGE = 20

export default async function DatasetPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))

  let data: PaginatedPredictions
  let fetchError: string | null = null

  try {
    data = await fetchServer<PaginatedPredictions>(
      `/admin/predictions?page=${page}&limit=${ITEMS_PER_PAGE}&isCurated=true`
    )
  } catch (err) {
    fetchError =
      err instanceof Error
        ? err.message
        : "Gagal memuat dataset terverifikasi"

    data = {
      data: [],
      total: 0,
      page,
      limit: ITEMS_PER_PAGE,
      totalPages: 0,
    }
  }

  const hasPrevPage = page > 1
  const hasNextPage = page < data.totalPages

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dataset Terverifikasi
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Kumpulan data gambar dan hasil prediksi yang telah melalui proses
            kurasi. Siap diekspor untuk proses retraining model AI.
          </p>
        </div>

        <ExportButton />
      </div>

      {/* Error */}
      {fetchError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Gagal Memuat Data
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {fetchError}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Menampilkan{" "}
              {data.data.length > 0
                ? (page - 1) * ITEMS_PER_PAGE + 1
                : 0}
              –
              {Math.min(page * ITEMS_PER_PAGE, data.total)} dari total{" "}
              <span className="font-bold text-primary">
                {data.total}
              </span>{" "}
              data siap pakai.
            </p>
          </div>

          {data.data.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <h2 className="text-xl font-semibold">
                Belum Ada Dataset
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Belum ada hasil prediksi yang telah dikurasi.
              </p>
            </div>
          ) : (
            <PredictionCardGrid
              predictions={data.data}
              mode="dataset"
            />
          )}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {hasPrevPage ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/dataset?page=${page - 1}`}>
                    <ChevronLeftIcon className="mr-1 size-4" />
                    Sebelumnya
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeftIcon className="mr-1 size-4" />
                  Sebelumnya
                </Button>
              )}

              <span className="px-4 text-sm font-medium text-muted-foreground">
                {page} / {data.totalPages}
              </span>

              {hasNextPage ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/dataset?page=${page + 1}`}>
                    Berikutnya
                    <ChevronRightIcon className="ml-1 size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Berikutnya
                  <ChevronRightIcon className="ml-1 size-4" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}