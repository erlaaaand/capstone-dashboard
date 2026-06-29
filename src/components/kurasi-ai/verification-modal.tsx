"use client"

import * as React from "react"
import Image from "next/image"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircleIcon, XCircleIcon, LoaderIcon, CalendarIcon, HashIcon, InfoIcon, TrashIcon } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Textarea } from "@/src/components/ui/textarea"
import { Badge } from "@/src/components/ui/badge"
import { Label } from "@/src/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"

import { AdminPredictionService } from "@/src/core/services/prediction.service"
import { Prediction } from "@/src/core/types/prediction.types"
import { formatDate } from "@/src/core/lib/format"
import { DURIAN_VARIETIES } from "@/src/core/constants/app.constants"

interface VerificationModalProps {
  prediction: Prediction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  readOnly?: boolean
}

export function VerificationModal({
  prediction,
  open,
  onOpenChange,
  readOnly = false,
}: VerificationModalProps) {
  const router = useRouter()
  const [adminNote, setAdminNote] = React.useState("")
  const [correctedVariety, setCorrectedVariety] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset formulir state setiap kali modal dibuka dengan data baru
  React.useEffect(() => {
    if (open) {
      setAdminNote(prediction?.adminNote ?? "")
      setCorrectedVariety(prediction?.actualVarietyCode ?? "")
    }
  }, [open, prediction])

  async function handleVerify(isVerified: boolean) {
    if (!prediction) return

    // Validasi: Wajib memilih item dropdown jika admin menyatakan prediksi AI salah
    if (!isVerified && !correctedVariety) {
      toast.error("Pilih varietas koreksi!", {
        description: "Jika hasil prediksi AI salah, Anda wajib menentukan opsi varietas yang sebenarnya.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await AdminPredictionService.verify(prediction.id, {
        isVerified,
        adminNote: adminNote.trim() || undefined,
        correctedVarietyCode: !isVerified ? correctedVariety : undefined,
      })
      toast.success("Validasi berhasil disimpan", {
        description: `Prediksi #${prediction.id.slice(0, 8)} ditandai sebagai ${isVerified ? "Benar" : "Salah (Dikoreksi)"}.`,
      })
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error("Validasi gagal", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses data.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!prediction) return
    const isConfirmed = window.confirm("Yakin ingin menghapus data gambar ini secara permanen? Data yang bukan durian sebaiknya dihapus.")
    if (!isConfirmed) return

    setIsSubmitting(true)
    try {
      await AdminPredictionService.delete(prediction.id)
      toast.success("Data berhasil dihapus")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error("Gagal menghapus data", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan server.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!prediction) return null

  const statusVariant =
    prediction.status === "SUCCESS"
      ? "default"
      : prediction.status === "FAILED"
        ? "destructive"
        : "secondary"

  const isFailedPrediction = prediction.status === "FAILED"
  const isCurated = typeof prediction.isVerified === "boolean"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-w-[95vw] gap-5 p-6 overflow-hidden rounded-xl">
        {/* Header Modal */}
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Validasi & Koreksi Hasil AI
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tinjau detail visual dan tingkat keyakinan klasifikasi. Konfirmasi akurasi data atau perbarui label jika terjadi salah deteksi.
          </DialogDescription>
        </DialogHeader>

        {/* Konten Utama Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* ── Kolom Kiri: Visual/Gambar Container ── */}
          <div className="md:col-span-5 flex flex-col gap-2 w-full">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted/30 shadow-inner group">
              <Image
                src={prediction.imageUrl}
                alt={`Scan durian — ${prediction.varietyName ?? "tidak diketahui"}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, 250px"
                unoptimized
              />
            </div>
            {/* Metadata Ringkas Gambar */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <HashIcon className="size-3" /> #{prediction.id.slice(0, 8)}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="size-3" /> {formatDate(prediction.createdAt)}
              </span>
            </div>
          </div>

          {/* ── Kolom Kanan: Detail Informasi & Form Koreksi ── */}
          <div className="md:col-span-7 flex flex-col gap-4 h-full justify-between">
            {/* Panel Ringkasan Prediksi AI (Tidak Berubah) */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-medium text-muted-foreground">Status Analisis</span>
                <Badge variant={statusVariant} className="text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
                  {prediction.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Prediksi AI</span>
                  <span className="text-sm font-bold text-foreground truncate block mt-0.5">
                    {prediction.varietyCode ? `${prediction.varietyCode} — ${prediction.varietyName}` : "Tidak Dikenali"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Tingkat Keyakinan</span>
                  <span className="text-sm font-mono font-bold text-foreground block mt-0.5">
                    {prediction.confidenceScore != null ? `${(prediction.confidenceScore * 100).toFixed(1)}%` : "—"}
                  </span>
                </div>
              </div>

              {/* Tampilan status kurasi sebelumnya */}
              {isCurated && (
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Verifikasi Sebelumnya:</span>
                    <Badge variant={prediction.isVerified ? "outline" : "destructive"} className="text-[10px] px-1.5 py-0">
                      {prediction.isVerified ? "✓ Sesuai" : "✗ Salah"}
                    </Badge>
                  </div>

                  {/* Tampilkan koreksi admin jika ada */}
                  {prediction.actualVarietyCode && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Koreksi Admin:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {prediction.actualVarietyCode}
                      </span>
                    </div>
                  )}

                  {/* Tampilkan catatan admin sebelumnya jika ada */}
                  {prediction.adminNote && (
                    <div className="text-xs">
                      <span className="text-muted-foreground block mb-0.5">Catatan:</span>
                      <p className="text-foreground/80 bg-muted/60 rounded-md px-2 py-1.5 text-[11px] leading-relaxed italic">
                        &ldquo;{prediction.adminNote}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Waktu verifikasi */}
                  {prediction.verifiedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Waktu Verifikasi:</span>
                      <span className="text-foreground/70">{formatDate(prediction.verifiedAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Pilihan Dropdown Koreksi */}
            <div className={`rounded-xl border p-4 transition-all duration-200 ${correctedVariety ? 'border-amber-500/30 bg-amber-500/5 shadow-xs' : 'border-border bg-background'}`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="correction-select" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <InfoIcon className={`size-3.5 ${correctedVariety ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    Koreksi Varietas Sebenarnya
                  </Label>
                  {correctedVariety && (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 rounded-sm">
                      Koreksi Aktif
                    </span>
                  )}
                </div>

                <Select
                  value={correctedVariety}
                  onValueChange={setCorrectedVariety}
                  disabled={isSubmitting || readOnly}
                >
                  <SelectTrigger id="correction-select" className="w-full h-9 text-xs font-medium shadow-2xs">
                    <SelectValue placeholder="Pilih varietas durian yang benar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DURIAN_VARIETIES.map((variety) => (
                      <SelectItem key={variety.code} value={variety.code} className="text-xs">
                        <span className="font-mono font-bold text-primary mr-1">[{variety.code}]</span> — {variety.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                  Isi opsi di atas hanya jika penafsiran sistem kecerdasan buatan tidak sesuai dengan fisik asli.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Baris Bawah: Input Catatan Keterangan ── */}
        <div className="flex flex-col gap-1.5 border-t border-border pt-4">
          <Label htmlFor="modal-admin-note" className="text-xs font-semibold text-foreground">
            Catatan Tambahan Admin
          </Label>
          <Textarea
            id="modal-admin-note"
            placeholder="Masukkan keterangan pendukung audit data data kurasi (misal: ciri fisik, kematangan, atau alasan penolakan)..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            disabled={isSubmitting || readOnly}
            className="resize-none min-h-[70px] text-xs leading-relaxed focus-visible:ring-1"
            rows={2}
          />
        </div>

        {/* ── Footer Kontrol Aksi Utama ── */}
        <DialogFooter className="flex sm:flex-row flex-col gap-2 border-t border-border pt-4 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs h-9 sm:w-auto w-full"
          >
            Batal
          </Button>

          <Button
            variant="destructive"
            onClick={() => handleVerify(false)}
            disabled={isSubmitting}
            className="text-xs h-9 sm:w-auto w-full gap-1.5 font-medium shadow-xs"
          >
            {isSubmitting ? (
              <LoaderIcon className="size-3.5 animate-spin" />
            ) : (
              <XCircleIcon className="size-3.5" />
            )}
            Simpan Koreksi (Salah)
          </Button>

          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="text-xs h-9 sm:w-auto w-full text-destructive hover:text-destructive hover:bg-destructive/10 sm:mr-auto"
          >
            <TrashIcon className="size-3.5 mr-1.5" />
            Hapus Gambar
          </Button>

          {!isFailedPrediction && (
            <Button
              onClick={() => handleVerify(true)}
              disabled={isSubmitting || !!correctedVariety}
              className="text-xs h-9 sm:w-auto w-full gap-1.5 font-medium shadow-xs"
            >
              {isSubmitting ? (
                <LoaderIcon className="size-3.5 animate-spin" />
              ) : (
                <CheckCircleIcon className="size-3.5" />
              )}
              Konfirmasi (Benar)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}