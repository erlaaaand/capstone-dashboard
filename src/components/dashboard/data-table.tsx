"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DownloadIcon, Trash2Icon, LoaderIcon } from "lucide-react"

import { DataTable } from "@/src/components/dashboard/data-table"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Skeleton } from "@/src/components/ui/skeleton"

import { DatasetService } from "@/src/core/services/dataset.service"
import { Dataset, DatasetStatus } from "@/src/core/types/dataset.types"
import { formatDate, formatNumber } from "@/src/core/lib/format"

const PAGE_LIMIT = 10

const statusVariant: Record<DatasetStatus, "default" | "outline" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  PROCESSING: "outline",
  READY: "default",
  FAILED: "destructive",
}

const statusLabel: Record<DatasetStatus, string> = {
  DRAFT: "Draft",
  PROCESSING: "Memproses",
  READY: "Siap",
  FAILED: "Gagal",
}

export function DatasetsTable() {
  const [page, setPage] = React.useState(1)
  const [datasets, setDatasets] = React.useState<Dataset[]>([])
  const [totalPages, setTotalPages] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await DatasetService.list(page, PAGE_LIMIT)
      setDatasets(result.data)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dataset")
    } finally {
      setIsLoading(false)
    }
  }, [page])

  React.useEffect(() => {
    load()
  }, [load])

  const handleExport = async (dataset: Dataset) => {
    setPendingActionId(dataset.id)
    try {
      await DatasetService.export(dataset.id)
      toast.success("Ekspor dimulai", {
        description: `Dataset "${dataset.name}" sedang diekspor.`,
      })
      await load()
    } catch (err) {
      toast.error("Gagal mengekspor dataset", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setPendingActionId(null)
    }
  }

  const handleDelete = async (dataset: Dataset) => {
    setPendingActionId(dataset.id)
    try {
      await DatasetService.delete(dataset.id)
      toast.success("Dataset dihapus", {
        description: `Dataset "${dataset.name}" telah dihapus.`,
      })
      await load()
    } catch (err) {
      toast.error("Gagal menghapus dataset", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setPendingActionId(null)
    }
  }

  const columns: ColumnDef<Dataset>[] = [
    {
      accessorKey: "name",
      header: "Nama",
    },
    {
      accessorKey: "exportFormat",
      header: "Format",
      cell: ({ row }) => <Badge variant="outline">{row.original.exportFormat}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>
          {statusLabel[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "totalItems",
      header: "Jumlah Item",
      cell: ({ row }) => formatNumber(row.original.totalItems),
    },
    {
      accessorKey: "createdAt",
      header: "Dibuat",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const dataset = row.original
        const isPending = pendingActionId === dataset.id
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => handleExport(dataset)}
              disabled={isPending}
              title="Ekspor dataset"
            >
              {isPending ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <DownloadIcon />
              )}
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => handleDelete(dataset)}
              disabled={isPending}
              title="Hapus dataset"
            >
              <Trash2Icon />
            </Button>
          </div>
        )
      },
    },
  ]

  if (isLoading && datasets.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="px-4 text-sm text-destructive lg:px-6">{error}</div>
  }

  return (
    <div className="px-4 lg:px-6">
      <DataTable
        columns={columns}
        data={datasets}
        pageCount={totalPages}
        currentPage={page}
        onPaginationChange={setPage}
      />
    </div>
  )
}