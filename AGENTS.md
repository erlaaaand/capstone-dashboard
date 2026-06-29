# AGENTS.md — System Prompt / Aturan Teknis & Performa
## Web Admin Dashboard — Sistem Klasifikasi Visual Varietas Durian

> Dokumen ini adalah aturan teknis WAJIB saat menulis atau merefaktor kode di repo `capstone-dashboard`. Untuk visi bisnis dan hasil audit, lihat `CLAUDE.md`.
>
> **Catatan revisi:** Menggantikan total `AGENTS.md` versi sebelumnya. Beberapa instruksi di versi sebelumnya keliru terhadap kondisi repo saat ini (lihat catatan "✅ Sudah benar, jangan tulis ulang" di bawah) — dokumen ini sudah dikoreksi berdasarkan pembacaan langsung source code.

---

## 1. Tumpukan Teknologi — Tidak Bisa Ditawar

- **Next.js App Router** (repo ini sudah Next `16.2.7`) — jangan pakai Pages Router, jangan campur konvensi lama.
- **React 19**, **TypeScript strict mode** (`tsconfig.json` sudah `"strict": true`) — jangan dilonggarkan.
- **Tailwind CSS v4** via `@tailwindcss/postcss` — jangan menulis CSS module atau styled-components baru.
- **shadcn/ui** (style `radix-nova`, base color `neutral`, icon library `lucide-react`) — pakai komponen yang sudah ada di `src/components/ui/` sebelum menambah komponen baru. Tambah komponen baru hanya lewat `npx shadcn add <nama>`, jangan tulis primitive manual.
  - **Sebelum menjalankan `npx shadcn add` apa pun**, perbaiki dulu `aliases` di `components.json` — saat ini menyebut `@/components`, `@/lib/utils`, `@/hooks` (tanpa `src/`), padahal seluruh kode nyata memakai `@/src/components/...`, `@/src/core/...`. Jika tidak diperbaiki dulu, komponen baru akan jatuh ke folder yang salah.
  - Komponen yang **harus ditambahkan** untuk Modal Validasi (belum ada di repo): `dialog`, `textarea`. Verifikasi dengan `ls src/components/ui/` sebelum mengasumsikan primitive lain (`alert-dialog`, `form`, dll) sudah tersedia — jangan asumsikan, cek dulu.
- Alias import: `@/*` → root project (`tsconfig.json` sudah benar: `"@/*": ["./*"]`). Path nyata di kode pakai `@/src/components/...`, `@/src/core/...` — **pertahankan pola ini**.
- State global: **tidak perlu** Redux/Zustand. `useState`/`useReducer` lokal di Client Component sudah cukup untuk scope dashboard ini.

---

## 2. Aturan Environment Variable & API Base URL

| Variabel | Dipakai oleh | Sudah benar di kode? |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **Client Component** — axios instance di `src/core/api/api-client.ts` | ✅ Sudah benar. Jangan ganti nama variabel ini — sudah konsisten di kode, bukan `NEXT_PUBLIC_API_URL` seperti sempat salah diklaim sebelumnya. |
| `INTERNAL_API_BASE_URL` | **Server Component / Route Handler** — `fetchServer()` di `src/core/api/server-client.ts` | ✅ Sudah benar dan sudah dipakai di fungsi `fetchServer`. Yang belum: **fungsi ini belum dipanggil dari Server Component manapun** — itu yang harus dikerjakan, bukan menulis ulang fungsinya. |

**Belum ada satu pun file `.env*` di repo** — ini yang benar-benar perlu dibuat. Buat `.env.example` di root:

```bash
# .env.example
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1
INTERNAL_API_BASE_URL=http://127.0.0.1:3001/api/v1
```

Jangan pernah meng-expose `INTERNAL_API_BASE_URL` ke bundle client — variabel tanpa prefix `NEXT_PUBLIC_` otomatis hanya tersedia di server. Manfaatkan ini, jangan dilewati dengan trik apa pun (mis. jangan diteruskan manual sebagai prop dari Server ke Client Component).

---

## 3. Header Otorisasi — Wajib di Setiap Request

Setiap request ke backend NestJS **harus** menyertakan `Authorization: Bearer <token>`.

**Sisi Client** — sudah terpasang dan benar di `src/core/api/api-client.ts`, **jangan tulis ulang**, hanya pertahankan:
```ts
apiClient.interceptors.request.use((config) => {
  const token = getCookie('admin_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Sisi Server** — sudah ada dan sudah benar di `src/core/api/server-client.ts`. **Jangan tulis fungsi baru** — panggil yang sudah ada:
```ts
// src/core/api/server-client.ts (SUDAH ADA — gunakan langsung, jangan duplikasi)
export async function fetchServer<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  const baseUrl = process.env.INTERNAL_API_BASE_URL || 'http://127.0.0.1:3001/api/v1'
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Gagal memuat data: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}
```

Pemakaian wajib di setiap Server Component yang fetch data awal:
```tsx
// app/dashboard/kurasi-ai/page.tsx
import { fetchServer } from "@/src/core/api/server-client"

export default async function KurasiAiPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Number(pageParam ?? 1)
  const data = await fetchServer(`/admin/predictions?page=${page}&limit=20`)
  return <PredictionCardGrid data={data} />
}
```

Jika token tidak ada di cookie saat Server Component jalan, `middleware.ts` yang sudah ada akan redirect ke `/login` lebih dulu — **jangan duplikasi logic redirect** di tiap halaman.

**Catatan integrasi yang wajib diverifikasi sebelum dipakai apa adanya:** `src/core/services/prediction.service.ts` saat ini mengakses `response.data` di dalam `list()`/`verify()`, padahal response interceptor di `api-client.ts` sudah `return response.data` lebih dulu. Sebelum mengandalkan service ini, log nilai aktual saat runtime sekali untuk memastikan tidak terjadi double-unwrap (TypeScript tidak akan memprotes ini karena tipe generik axios tidak tahu soal interceptor).

---

## 4. ATURAN EFISIENSI RESOURCE & REFACTORING (Sangat Penting)

### a. Pemisahan Server Component vs Client Component — WAJIB

Tidak ada lagi pola `"use client"` + `useEffect` untuk **fetch data awal**, mulai sekarang.

Aturan:
- `page.tsx`, `layout.tsx`, navbar/sidebar statis, **fetch data awal** → **Server Component** (default, tanpa `"use client"`).
- Hanya beri `"use client"` pada unit yang benar-benar butuh interaktivitas browser:
  - Modal/Dialog validasi (`VerificationModal`)
  - Form (login, catatan admin)
  - State lokal (toggle range waktu chart, dropdown, tombol dengan loading state)
- `SectionCards` dan `ChartAreaInteractive` boleh tetap `"use client"` untuk MVP — keduanya sudah berfungsi dan tidak melanggar larangan harga. Saat direfaktor di Fase 3 (lihat `CLAUDE.md`), pindahkan fetch awalnya ke pembungkus Server Component dan kirim sebagai props jika sumber daya memungkinkan; ini peningkatan, bukan blocker untuk fitur Kurasi AI.
- **Catatan penting soal `app/dashboard/page.tsx` saat ini:** file ini sudah Server Component (tidak ada `"use client"`), tapi merender `PredictionsTable` dan `DatasetsTable` yang keduanya Client Component dengan fetch sendiri. Tidak ada `dashboard/layout.tsx` terpisah — sidebar dirender langsung di `page.tsx`. **Buat `app/dashboard/layout.tsx` baru** untuk menampung sidebar/header bersama, supaya rute baru (`/dashboard/kurasi-ai`) tidak perlu duplikasi markup sidebar.

### b. Komponen `<Image />` Wajib untuk Semua Foto Durian

- Jangan pernah pakai `<img>` mentah untuk thumbnail durian. (Catatan: `login-form.tsx` saat ini punya `<img src="/placeholder.svg">` yang **filenya tidak ada** di `public/` — perbaiki ini juga sekalian, bukan hanya di Card/Modal.)
- `next.config.ts` **sudah** punya `images.remotePatterns` untuk `127.0.0.1:3001` dan `localhost:3001`. **Sebelum deploy**, tambahkan domain storage production yang sebenarnya:
  ```ts
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '3001', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/**' },
      // WAJIB ditambahkan sebelum deploy:
      { protocol: 'https', hostname: '**.domain-storage-production-anda.com' },
    ],
  }
  ```
- Selalu set `width`/`height` atau gunakan `fill` di dalam container beraspek rasio fixed (`aspect-square`) agar tidak terjadi *layout shift*.
- Thumbnail di Card: ukuran kecil + `sizes` sesuai grid (mis. `sizes="(max-width: 768px) 50vw, 25vw"`). Gambar full di Modal: boleh `priority` karena hanya satu yang tampil saat modal terbuka.

### c. Pagination Efisien — Wajib

- **Dilarang** mengulang pola lama: `useState(page)` di Client Component + refetch manual via `useEffect` (pola ini ada di `prediction-table.tsx` dan `datasets-table.tsx` — jangan dicontoh untuk Card Grid).
- Pola baru: pagination dikendalikan lewat **`searchParams` URL** (`?page=2`), dibaca di Server Component, link "Next/Prev" pakai `<Link href="?page=...">` biasa (Next.js otomatis prefetch).
- Limit per halaman untuk Card Grid: 12–24 item (kelipatan kolom grid), bukan 10 seperti tabel teks dulu.

### d. Reusability & Dead Code — Wajib Dibersihkan

Sebelum menulis komponen baru, cek dulu apakah primitive relevan sudah ada di `src/components/ui/` (jalankan `ls src/components/ui/` — jangan asumsikan dari memori percakapan).

**Wajib dihapus** (sudah terverifikasi via grep — lihat `CLAUDE.md` Bagian 2 untuk detail bukti):
- `src/components/dashboard/datasets-table.tsx` dan `src/core/types/dataset.types.ts` — mengimpor `dataset.service.ts` yang **tidak ada filenya**. Ini bukan "boleh diarsipkan nanti", ini **harus dihapus sekarang** karena modul backend-nya sudah dihapus dan importnya membuat proyek gagal build.
- `src/components/dashboard/nav-documents.tsx`, `nav-secondary.tsx` — 0 pemakaian terverifikasi.
- `src/components/ui/breadcrumb.tsx`, `checkbox.tsx`, `drawer.tsx` — 0 pemakaian terverifikasi.
- Setelah Card Grid menggantikan `prediction-table.tsx`: `src/components/ui/table.tsx`, `data-table.tsx`, dependency `@tanstack/react-table`.
- Dependency `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — tercatat di `package-lock.json` tapi 0 pemakaian dan tidak ada di `package.json`. Setelah dipastikan tidak ada di `package.json`, jalankan `npm install` untuk membersihkan lockfile.

**Setelah keputusan dependency final, jalankan `npm install` ulang** — jangan edit `package.json` secara manual tanpa regenerasi `package-lock.json`; kondisi ini sudah terjadi sebelumnya (`@tanstack/react-table` & `@dnd-kit/*` tercatat di lockfile tapi tidak ada di `package.json`) dan harus diperbaiki, bukan ditambah.

Sebelum membuat fungsi util baru, cek `src/core/lib/format.ts` (`formatDate`, `formatNumber`, `formatPercent`, `percentChange`) dan `src/core/lib/utils.ts` (`cn`) dulu — kemungkinan besar sudah ada.

---

## 5. Konvensi Struktur Folder

```
src/
  app/
    dashboard/
      layout.tsx                       (BARU — pindahkan sidebar/header ke sini)
      page.tsx                         (disederhanakan: SectionCards + ChartAreaInteractive saja)
      kurasi-ai/page.tsx                (BARU)
    login/page.tsx
  components/
    dashboard/                  → sidebar, header, chart, section-cards
    kurasi-ai/                  → BARU: prediction-card.tsx, verification-modal.tsx
    login/
    ui/                         → primitive shadcn, jangan taruh logic bisnis di sini
  core/
    api/                        → api-client.ts (client, SUDAH BENAR), server-client.ts (server, SUDAH BENAR, belum dipakai)
    services/                   → satu file per domain (prediction, auth, ai-health). dataset.service.ts SENGAJA tidak ada — jangan dibuat ulang.
    types/                      → satu file per domain
    hooks/
    lib/
    constants/
    validations/                → zod schema (loginSchema sudah ada — sambungkan ke login-form.tsx)
```

Penamaan file: `kebab-case.tsx` untuk file, `PascalCase` untuk nama komponen/export — konsisten dengan kode yang sudah ada.

---

## 6. Gaya Kode

- Komentar inline pakai **Bahasa Indonesia**, mengikuti gaya yang sudah ada (`// Minta parent untuk reload data agar baris diperbarui`).
- Error handling: pola `err instanceof Error ? err.message : 'pesan default Bahasa Indonesia'` — sudah konsisten dipakai di service-service lama, pertahankan.
- Notifikasi: `sonner` (`toast.success`/`toast.error`) — sudah terpasang global di `layout.tsx`, jangan tambah library notifikasi lain.
- Validasi form: `zod`. `loginSchema` di `src/core/validations/auth.schema.ts` sudah ada tapi **belum dipakai** oleh `login-form.tsx` (form ini masih validasi manual dengan regex sendiri) — sambungkan, jangan tulis skema baru.
- UI teks: konsisten Bahasa Indonesia. `login-form.tsx` saat ini masih menyisakan teks Inggris template ("Welcome back", "Login to your Acme Inc account") — ganti agar konsisten dengan rest of app.

---

## 7. Checklist Sebelum Commit (Performance & Correctness)

- [ ] `npm run build` berhasil tanpa error import (cek khusus: tidak ada lagi referensi ke `dataset.service.ts`).
- [ ] `package.json` dan `package-lock.json` sinkron (`npm install` dijalankan ulang setelah perubahan dependency).
- [ ] Tidak ada `"use client"` di komponen yang sebenarnya tidak butuh state/event handler.
- [ ] Setiap gambar durian pakai `<Image />`, bukan `<img>` (termasuk halaman Login).
- [ ] `next.config.ts` punya `images.remotePatterns` yang mengizinkan domain storage backend production.
- [ ] Pagination dikendalikan via `searchParams`, bukan `useState` lokal yang reset saat reload.
- [ ] Setiap call API menyertakan `Authorization: Bearer <token>` (cek lewat Network tab).
- [ ] Tidak ada harga pasar yang ter-render di Card/Modal Kurasi AI.
- [ ] Sidebar hanya berisi 2 menu: Dashboard, Kurasi AI.
- [ ] Tidak menambah dependency baru tanpa memverifikasi belum ada solusi dari shadcn/Tailwind/lib yang sudah terpasang.
- [ ] `npm run lint` bersih (ESLint config sudah ada di `eslint.config.mjs`).