"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LoaderIcon, LeafIcon } from "lucide-react"

import { cn } from "@/src/core/lib/utils"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"

import { AuthService } from "@/src/core/services/auth.service"
import { loginSchema } from "@/src/core/validations/auth.schema"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string
    password?: string
  }>({})
  const [formError, setFormError] = React.useState<string | null>(null)

  function validate(): boolean {
    // Gunakan loginSchema zod yang sudah ada — bukan validasi manual
    const result = loginSchema.safeParse({ email, password })
    if (result.success) {
      setFieldErrors({})
      return true
    }
    const errors: { email?: string; password?: string } = {}
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as "email" | "password"
      if (!errors[field]) errors[field] = issue.message
    })
    setFieldErrors(errors)
    return false
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await AuthService.login({ email, password })
      toast.success("Berhasil Masuk", {
        description: `Selamat datang kembali, ${response.user?.fullName ?? "Admin"}.`,
      })
      router.push("/dashboard")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Email atau password salah."
      setFormError(message)
      toast.error("Gagal Masuk", { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              {/* Judul form — Bahasa Indonesia, branding Durian Classifier */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-2">
                  <LeafIcon className="size-6 text-green-500" />
                  <span className="text-xl font-bold">Durian Classifier</span>
                </div>
                <h1 className="text-2xl font-bold">Masuk ke Dashboard</h1>
                <p className="text-balance text-muted-foreground">
                  Masukkan kredensial akun admin Anda
                </p>
              </div>

              {formError && (
                <FieldError className="text-center">{formError}</FieldError>
              )}

              <Field data-invalid={!!fieldErrors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!fieldErrors.email}
                  disabled={isSubmitting}
                  autoComplete="email"
                  required
                />
                <FieldError>{fieldErrors.email}</FieldError>
              </Field>

              <Field data-invalid={!!fieldErrors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!fieldErrors.password}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />
                <FieldError>{fieldErrors.password}</FieldError>
              </Field>

              <Field>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <LoaderIcon className="animate-spin" />
                      Sedang masuk...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          {/* ── Kolom kanan: ilustrasi branding ── */}
          <div className="relative hidden flex-col items-center justify-center gap-4 bg-gradient-to-br from-green-900 to-green-700 p-8 md:flex">
            <LeafIcon className="size-20 text-green-300 opacity-80" />
            <div className="text-center">
              <p className="text-xl font-bold text-white">Durian Classifier</p>
              <p className="mt-1 text-sm text-green-200 opacity-80">
                Sistem Klasifikasi Visual Varietas Durian
              </p>
            </div>
            <p className="mt-4 max-w-xs text-center text-xs text-green-300 opacity-60">
              Platform admin untuk mengelola dan memvalidasi hasil prediksi AI berbasis EfficientNet
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}