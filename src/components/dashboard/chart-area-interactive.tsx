"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/src/core/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/src/components/ui/toggle-group"
import { Skeleton } from "@/src/components/ui/skeleton"

import { AdminPredictionService } from "@/src/core/services/prediction.service"
import { formatShortDate } from "@/src/core/lib/format"

export const description = "Tren prediksi harian: berhasil vs gagal"

const chartConfig = {
  predictions: {
    label: "Prediksi",
  },
  success: {
    label: "Berhasil",
    color: "var(--primary)",
  },
  failed: {
    label: "Gagal",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

interface DailyPoint {
  date: string
  success: number
  failed: number
}

const FETCH_LIMIT = 200

function buildDailySeries(
  predictions: { createdAt: string; status: string }[]
): DailyPoint[] {
  const byDate = new Map<string, DailyPoint>()

  for (const prediction of predictions) {
    const dateKey = prediction.createdAt.slice(0, 10) // YYYY-MM-DD
    const existing = byDate.get(dateKey) ?? { date: dateKey, success: 0, failed: 0 }
    if (prediction.status === "SUCCESS") {
      existing.success += 1
    } else if (prediction.status === "FAILED") {
      existing.failed += 1
    }
    byDate.set(dateKey, existing)
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [series, setSeries] = React.useState<DailyPoint[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await AdminPredictionService.list({
          page: 1,
          limit: FETCH_LIMIT,
        })
        if (!isMounted) return
        setSeries(buildDailySeries(result.data))
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Gagal memuat tren prediksi")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredData = React.useMemo(() => {
    if (series.length === 0) return []
    const referenceDate = new Date(series[series.length - 1].date)
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return series.filter((item) => new Date(item.date) >= startDate)
  }, [series, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Tren Prediksi</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Jumlah prediksi berhasil vs gagal
          </span>
          <span className="@[540px]/card:hidden">Berhasil vs gagal</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 bulan terakhir</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 hari terakhir</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 hari terakhir</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="3 bulan terakhir" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                3 bulan terakhir
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 hari terakhir
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 hari terakhir
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : error ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data prediksi pada rentang ini
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={1.0} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-failed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-failed)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => formatShortDate(value)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatShortDate(value)}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="failed"
                type="natural"
                fill="url(#fillFailed)"
                stroke="var(--color-failed)"
                stackId="a"
              />
              <Area
                dataKey="success"
                type="natural"
                fill="url(#fillSuccess)"
                stroke="var(--color-success)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}