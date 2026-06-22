"use client"

import * as React from "react"

import { Badge } from "@/src/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"
import { Skeleton } from "@/src/components/ui/skeleton"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  CircleAlertIcon,
} from "lucide-react"

import { AdminPredictionService } from "@/src/core/services/prediction.service"
import { DatasetService } from "@/src/core/services/dataset.service"
import { AiHealthService, AiStatusSnapshot } from "@/src/core/services/ai-health.service"
import { formatNumber, formatPercent, percentChange } from "@/src/core/lib/format"

interface SectionCardsData {
  totalPredictions: number
  totalPredictionsTrend: number
  verifiedPredictions: number
  verifiedRate: number
  totalDatasets: number
  totalDatasetItems: number
  aiStatus: AiStatusSnapshot | null
}

const PAGE_SIZE_FOR_TREND = 50

export function SectionCards() {
  const [data, setData] = React.useState<SectionCardsData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [allPredictions, verifiedPredictions, datasets, aiStatus] =
          await Promise.all([
            AdminPredictionService.list({ page: 1, limit: PAGE_SIZE_FOR_TREND }),
            AdminPredictionService.list({ page: 1, limit: 1, isVerified: true }),
            DatasetService.list(1, 1),
            AiHealthService.getCurrentStatus().catch(() => null),
          ])

        const recentWindow = allPredictions.data.slice(0, Math.floor(allPredictions.data.length / 2))
        const olderWindow = allPredictions.data.slice(Math.floor(allPredictions.data.length / 2))
        const trend = percentChange(recentWindow.length, olderWindow.length || 1)

        const verifiedRate =
          allPredictions.total > 0
            ? (verifiedPredictions.total / allPredictions.total) * 100
            : 0

        if (!isMounted) return

        setData({
          totalPredictions: allPredictions.total,
          totalPredictionsTrend: trend,
          verifiedPredictions: verifiedPredictions.total,
          verifiedRate,
          totalDatasets: datasets.total,
          totalDatasetItems: datasets.data.reduce(
            (sum, ds) => sum + (ds.totalItems ?? 0),
            0
          ),
          aiStatus,
        })
      } catch (err) {
        if (!isMounted) return
        setError(
          err instanceof Error ? err.message : "Gagal memuat ringkasan dashboard"
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <CircleAlertIcon className="size-4" />
              Gagal memuat data
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Prediksi</CardDescription>
          {isLoading || !data ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatNumber(data.totalPredictions)}
            </CardTitle>
          )}
          {!isLoading && data && (
            <CardAction>
              <Badge variant="outline">
                {data.totalPredictionsTrend >= 0 ? (
                  <TrendingUpIcon />
                ) : (
                  <TrendingDownIcon />
                )}
                {formatPercent(data.totalPredictionsTrend)}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Seluruh hasil prediksi tercatat
          </div>
          <div className="text-muted-foreground">
            Dibandingkan separuh data terakhir
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Prediksi Terverifikasi</CardDescription>
          {isLoading || !data ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatNumber(data.verifiedPredictions)}
            </CardTitle>
          )}
          {!isLoading && data && (
            <CardAction>
              <Badge variant="outline">
                <TrendingUpIcon />
                {data.verifiedRate.toFixed(1)}%
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tingkat verifikasi admin
          </div>
          <div className="text-muted-foreground">
            Dari total prediksi yang masuk
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Dataset</CardDescription>
          {isLoading || !data ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatNumber(data.totalDatasets)}
            </CardTitle>
          )}
          {!isLoading && data && (
            <CardAction>
              <Badge variant="outline">
                {formatNumber(data.totalDatasetItems)} item
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Dataset yang sudah dibuat
          </div>
          <div className="text-muted-foreground">
            Termasuk draft dan yang siap ekspor
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Status Model AI</CardDescription>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {data?.aiStatus?.status === "ONLINE" ? "Online" : "Offline"}
            </CardTitle>
          )}
          {!isLoading && (
            <CardAction>
              <Badge
                variant={data?.aiStatus?.status === "ONLINE" ? "outline" : "destructive"}
              >
                {data?.aiStatus?.status === "ONLINE" ? (
                  <TrendingUpIcon />
                ) : (
                  <TrendingDownIcon />
                )}
                {data?.aiStatus?.modelLoaded ? "Model siap" : "Model belum siap"}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {data?.aiStatus?.message ?? "Belum ada data status"}
          </div>
          <div className="text-muted-foreground">
            Uptime: {data?.aiStatus?.uptimeSeconds != null
              ? `${Math.floor(data.aiStatus.uptimeSeconds / 60)} menit`
              : "—"}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}