"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { CheckCircle2Icon, LoaderIcon, XCircleIcon } from "lucide-react"

import { DataTable } from "@/src/components/dashboard/data-table"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Skeleton } from "@/src/components/ui/skeleton"

import { AdminPredictionService } from "@/src/core/services/prediction.service"
import { Prediction, PredictionStatus } from "@/src/core/types/prediction.types"
import { formatDate } from "@/src/core/lib/format"

const PAGE_LIMIT = 10

const statusBadge: Record<
  PredictionStatus,
  { label: string; variant: "default" | "outline" | "destructive"; icon: React.ReactNode }
> = {
  SUCCESS: {
    label: "Berhasil",
    variant: "outline",
    icon: <CheckCircle2Icon className="text-primary" />,
  },
  PENDING: {
    label: "Diproses",
    variant: "outline",
    icon: <LoaderIcon className="animate-spin" />,
  },
  FAILED: {
    label: "Gagal",
    variant: "destructive",
    icon: <XCircleIcon />,
  },
}

const columns: ColumnDef<Prediction>[] = [
  {
    accessorKey: "varietyName",
    header: "Varietas",
    cell: ({ row }) => row.original.varietyName ?? "Belum dikenali",
  },
  {
    accessorKey: "confidenceScore",
    header: "Confidence",
    cell: ({ row }) => {
      const score = row.original.confidenceScore
      return score != null ? `${(score * 100).toFixed(1)}%` : "—"
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const meta = statusBadge[row.original.status]
      return (
        <Badge variant={meta.variant} className="gap-1">
          {meta.icon}
          {meta.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "isVerified",
    header: "Verifikasi",
    cell: ({ row }) =>
      row.original.isVerified ? (
        <Badge variant="outline">Terverifikasi</Badge>
      ) : (
        <Badge variant="secondary">Belum</Badge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <VerifyAction
        prediction={row.original}
        onVerified={(updated) => row.original && Object.assign(row.original, updated)}
      />
    ),
  },
]

function VerifyAction({
  prediction,
  onVerified,
}: {
  prediction: Prediction
  onVerified: (updated: Prediction) => void
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  if (prediction.isVerified) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Sudah diverifikasi
      </Button>
    )
  }

  const handleVerify = async () => {
    setIsSubmitting(true)
    try {
      const updated = await AdminPredictionService.verify(prediction.id, {
        isVerified: true,
      })
      onVerified(updated)
    } catch {
      // Kegagalan verifikasi ditangani secara silent di sini;
      // bisa dihubungkan ke toast jika diperlukan.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleVerify} disabled={isSubmitting}>
      {isSubmitting ? "Memverifikasi..." : "Verifikasi"}
    </Button>
  )
}

export function PredictionsTable() {
  const [page, setPage] = React.useState(1)
  const [predictions, setPredictions] = React.useState<Prediction[]>([])
  const [totalPages, setTotalPages] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await AdminPredictionService.list({
          page,
          limit: PAGE_LIMIT,
        })
        if (!isMounted) return
        setPredictions(result.data)
        setTotalPages(result.totalPages)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Gagal memuat prediksi")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [page])

  if (isLoading && predictions.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 text-sm text-destructive lg:px-6">{error}</div>
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <DataTable
        columns={columns}
        data={predictions}
        pageCount={totalPages}
        currentPage={page}
        onPaginationChange={setPage}
      />
    </div>
  )
}