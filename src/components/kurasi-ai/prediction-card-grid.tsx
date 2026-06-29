"use client"

import * as React from "react"
import Image from "next/image"
import { Badge } from "@/src/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/src/components/ui/card"
import { Prediction } from "@/src/core/types/prediction.types"
import { formatDate } from "@/src/core/lib/format"
import { VerificationModal } from "@/src/components/kurasi-ai/verification-modal"
import { CheckCircle2, XCircle, Clock3, Leaf } from "lucide-react"

interface PredictionCardGridProps {
  predictions: Prediction[]
  mode?: "curation" | "dataset"
}

export function PredictionCardGrid({ predictions, mode = "curation" }: PredictionCardGridProps) {
  const [selectedPrediction, setSelectedPrediction] = React.useState<Prediction | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

  function handleCardClick(prediction: Prediction): void {
    if (prediction.status === "PENDING") return
    setSelectedPrediction(prediction)
    setModalOpen(true)
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl">
        <div className="size-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <Leaf className="size-6 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">Tidak ada data ditemukan</p>
        <p className="text-sm text-muted-foreground">
          {mode === "curation"
            ? "Semua prediksi sudah dikurasi. Tidak ada antrean baru."
            : "Belum ada data prediksi yang terverifikasi."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {predictions.map((prediction: Prediction) => {
          const isPending = prediction.status === "PENDING"
          const isCurated = typeof prediction.isVerified === "boolean"

          return (
            <Card
              key={prediction.id}
              className={[
                "overflow-hidden transition-all duration-300 group hover:shadow-lg",
                isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:ring-2 hover:ring-primary/20",
                isCurated && !isPending ? "border-primary/20 bg-primary/5" : ""
              ].join(" ")}
              onClick={() => handleCardClick(prediction)}
            >
              <div className="relative aspect-square w-full bg-muted overflow-hidden">
                <Image
                  src={prediction.imageUrl}
                  alt={`Durian ${prediction.varietyName ?? "Unidentified"}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 20vw"
                  unoptimized
                />

                <div className="absolute top-2 right-2">
                  <Badge variant={prediction.status === 'SUCCESS' ? 'default' : 'destructive'} className="shadow-sm">
                    {prediction.status}
                  </Badge>
                </div>

                {/* Badge status kurasi — hanya tampil di mode dataset */}
                {mode === "dataset" && isCurated && (
                  <div className="absolute bottom-2 right-2">
                    <Badge variant={prediction.isVerified ? "default" : "destructive"} className="gap-1 shadow-sm">
                      {prediction.isVerified ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                      {prediction.isVerified ? "Benar" : "Dikoreksi"}
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="px-3 pt-3 pb-0">
                {/* Tampilkan koreksi admin sebagai label utama jika ada (mode dataset) */}
                {mode === "dataset" && prediction.actualVarietyCode ? (
                  <div className="space-y-0.5">
                    <p className="truncate text-sm font-bold text-amber-600 dark:text-amber-400">
                      {prediction.actualVarietyCode} (Koreksi)
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground line-through">
                      AI: {prediction.varietyCode ?? "?"} — {prediction.varietyName ?? "?"}
                    </p>
                  </div>
                ) : (
                  <p className="truncate text-sm font-bold">
                    {prediction.varietyCode ? `${prediction.varietyCode} — ${prediction.varietyName}` : "Tidak Dikenali"}
                  </p>
                )}
              </CardHeader>

              <CardContent className="px-3 pt-1 pb-2">
                <p className="font-mono text-[10px] text-muted-foreground">
                  ID: {prediction.id.slice(0, 8)}
                </p>
              </CardContent>

              <CardFooter className="px-3 pb-3 pt-0 flex justify-between items-center">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock3 className="size-3" />
                  {formatDate(prediction.createdAt)}
                </p>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <VerificationModal
        prediction={selectedPrediction}
        open={modalOpen}
        onOpenChange={(open: boolean) => {
          setModalOpen(open)
          if (!open) setSelectedPrediction(null)
        }}
        readOnly={mode === "dataset"}
      />
    </>
  )
}