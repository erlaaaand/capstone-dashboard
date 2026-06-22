import type { Metadata } from "next"
import { LoginForm } from "@/src/components/login/login-form"

export const metadata: Metadata = {
  title: "Login — Durian Classifier Admin",
  description: "Masuk ke panel administrasi",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  )
}