import * as React from "react"
import { AuthUser } from "@/src/core/types/auth.types"

const STORAGE_KEY = "admin_user"

export function useCurrentUser(): AuthUser | null {
  const [user, setUser] = React.useState<AuthUser | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setUser(JSON.parse(raw) as AuthUser)
      }
    } catch {
      setUser(null)
    }
  }, [])

  return user
}

/** Simpan data user setelah login berhasil, agar bisa dibaca oleh useCurrentUser. */
export function persistCurrentUser(user: AuthUser) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearCurrentUser() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}