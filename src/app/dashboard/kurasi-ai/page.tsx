import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { fetchServer } from "@/src/core/api/server-client"
import { PaginatedPredictions } from "@/src/core/types/prediction.types"
import { PredictionCardGrid } from "@/src/components/kurasi-ai/prediction-card-grid"
import { Button } from "@/src/components/ui/button"

export const metadata: Metadata = {
  title: "Kurasi AI",
  description: "Validasi hasil prediksi AI varietas durian sebagai mekanisme quality control.",
}

const ITEMS_PER_PAGE = 20

export default async function KurasiAiPage({
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
      `/admin/predictions?page=${page}&limit=${ITEMS_PER_PAGE}&isCurated=false`
    )


  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Gagal memuat data prediksi"
    data = { data: [], total: 0, page, limit: ITEMS_PER_PAGE, totalPages: 0 }
  }

  const hasPrevPage = page > 1
  const hasNextPage = page < data.totalPages

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* ── Header halaman ── */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {data.total > 0
              ? `Menampilkan ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, data.total)} dari ${data.total} prediksi`
              : "Belum ada data prediksi"}
          </p>
        </div>
        {data.totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {data.totalPages}
          </p>
        )}
      </div>

      {/* ── Error state ── */}
      {fetchError && (
        <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 lg:mx-6">
          <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
          <p className="text-sm text-muted-foreground">{fetchError}</p>
        </div>
      )}

      {/* ── Grid kartu prediksi ── */}
      <div className="px-4 lg:px-6">
        <PredictionCardGrid predictions={data.data} />
      </div>

      {/* ── Kontrol pagination — Link biasa, Next.js otomatis prefetch ── */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 pb-4 lg:px-6">
          {hasPrevPage ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`?page=${page - 1}`}>
                <ChevronLeftIcon className="size-4" />
                Sebelumnya
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeftIcon className="size-4" />
              Sebelumnya
            </Button>
          )}

          <span className="px-2 text-sm text-muted-foreground">
            {page} / {data.totalPages}
          </span>

          {hasNextPage ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`?page=${page + 1}`}>
                Berikutnya
                <ChevronRightIcon className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Berikutnya
              <ChevronRightIcon className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
