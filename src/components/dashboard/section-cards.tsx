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
  ClockIcon,
} from "lucide-react"

import { AdminPredictionService } from "@/src/core/services/prediction.service"
import { AiHealthService, AiStatusSnapshot } from "@/src/core/services/ai-health.service"
import { formatNumber, formatPercent, percentChange } from "@/src/core/lib/format"

interface SectionCardsData {
  totalPredictions: number
  totalPredictionsTrend: number
  verifiedPredictions: number
  verifiedRate: number
  pendingPredictions: number
  aiStatus: AiStatusSnapshot | null
}

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
        // Ambil data paralel: semua prediksi, yang terverifikasi, yang pending, dan status AI
        const [allResult, verifiedResult, pendingResult, aiStatus] =
          await Promise.all([
            AdminPredictionService.list({ page: 1, limit: 1 }),
            AdminPredictionService.list({ page: 1, limit: 1, isVerified: true }),
            AdminPredictionService.list({ page: 1, limit: 1, status: "PENDING" }),
            AiHealthService.getCurrentStatus().catch(() => null),
          ])

        // Hitung tren: bandingkan total prediksi vs total yang terverifikasi sebagai proxy tren
        // (idealnya dari backend dengan endpoint agregasi per hari)
        const trend = allResult.total > 0
          ? percentChange(verifiedResult.total, allResult.total - verifiedResult.total || 1)
          : 0

        const verifiedRate =
          allResult.total > 0
            ? (verifiedResult.total / allResult.total) * 100
            : 0

        if (!isMounted) return

        setData({
          totalPredictions: allResult.total,
          totalPredictionsTrend: trend,
          verifiedPredictions: verifiedResult.total,
          verifiedRate,
          pendingPredictions: pendingResult.total,
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
      {/* ── Kartu 1: Total Prediksi ── */}
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
            Rasio terverifikasi vs belum
          </div>
        </CardFooter>
      </Card>

      {/* ── Kartu 2: Prediksi Terverifikasi ── */}
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

      {/* ── Kartu 3: Prediksi Menunggu Verifikasi ── */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Menunggu Verifikasi</CardDescription>
          {isLoading || !data ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatNumber(data.pendingPredictions)}
            </CardTitle>
          )}
          {!isLoading && data && (
            <CardAction>
              <Badge variant={data.pendingPredictions > 0 ? "outline" : "outline"}>
                <ClockIcon />
                {data.pendingPredictions > 0 ? "Perlu tindakan" : "Semua selesai"}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Prediksi belum diproses AI
          </div>
          <div className="text-muted-foreground">
            Kunjungi Kurasi AI untuk meninjau
          </div>
        </CardFooter>
      </Card>

      {/* ── Kartu 4: Status Model AI ── */}
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