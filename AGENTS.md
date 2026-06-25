# agent.md — System Prompt / Aturan Teknis & Performa
## Web Admin Dashboard — Durian Variety Classification System

> Dokumen ini adalah aturan teknis WAJIB saat menulis atau merefaktor kode di repo `capstone-dashboard`. Untuk visi bisnis dan hasil audit, lihat `claude.md`.

---

## 1. Tumpukan Teknologi (Tech Stack) — Tidak Bisa Ditawar

- **Next.js App Router** (sudah Next 16.x di repo ini) — jangan pakai Pages Router, jangan campur konvensi lama.
- **TypeScript strict mode** — `tsconfig.json` sudah `"strict": true`, jangan dilonggarkan.
- **Tailwind CSS v4** — sudah terpasang via `@tailwindcss/postcss`. Jangan menulis CSS module/styled-components baru.
- **shadcn/ui** (style `radix-nova`, base color `neutral`, icon library `lucide-react`) — pakai komponen yang sudah ada di `src/components/ui/` sebelum menambah komponen baru. Tambah komponen baru hanya lewat `npx shadcn add <nama>`, jangan tulis primitive manual.
- Alias import: `@/*` → root project (sudah dikonfigurasi di `tsconfig.json`). Path nyata di kode pakai `@/src/components/...`, `@/src/core/...` — **pertahankan pola ini**, jangan ganti ke `@/components/...` walau `components.json` menyebut alias default berbeda.
- State global: **tidak perlu** Redux/Zustand untuk scope dashboard ini. `useState`/`useReducer` lokal di Client Component sudah cukup.

---

## 2. Aturan Environment Variable & API Base URL

Repo saat ini memakai `NEXT_PUBLIC_API_URL` di `src/core/api/api-client.ts` — **ini harus diganti**. Konvensi final:

| Variabel | Dipakai oleh | Contoh nilai |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **Client Component** (axios instance, dipanggil dari browser) | `https://api.duriaclassifier.id/api/v1` |
| `INTERNAL_API_BASE_URL` | **Server Component / Route Handler** (fetch dari server Next.js ke NestJS, bisa beda jaringan/internal) | `http://nestjs-backend:3001/api/v1` |

**Wajib** buat `.env.example` di root repo (saat ini belum ada satu pun file `.env*`):

```bash
# .env.example
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1
INTERNAL_API_BASE_URL=http://127.0.0.1:3001/api/v1
```

Jangan pernah meng-expose `INTERNAL_API_BASE_URL` ke bundle client — variabel tanpa prefix `NEXT_PUBLIC_` otomatis hanya tersedia di server, **manfaatkan ini**, jangan dilewati dengan trik apa pun.

---

## 3. Header Otorisasi — Wajib di Setiap Request

Setiap request ke backend NestJS **harus** menyertakan:

```
Authorization: Bearer <token>
```

**Sisi Client** (axios, sudah ada di `api-client.ts`, pertahankan pola interceptor-nya, hanya perbaiki nama env var):
```ts
apiClient.interceptors.request.use((config) => {
  const token = getCookie('admin_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Sisi Server** (baru — belum ada di repo, wajib dibuat sebelum menulis Server Component apa pun yang fetch data):
```ts
// src/core/api/server-client.ts
import { cookies } from 'next/headers'

export async function fetchServer(path: string, init?: RequestInit) {
  const token = (await cookies()).get('admin_token')?.value
  const res = await fetch(`${process.env.INTERNAL_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store', // data admin bersifat dinamis, jangan di-cache statis
  })
  if (!res.ok) throw new Error(`Gagal memuat data: ${res.status}`)
  return res.json()
}
```

Jika token tidak ada di cookie saat Server Component jalan, `middleware.ts` yang sudah ada seharusnya sudah redirect ke `/login` lebih dulu — jangan duplikasi logic redirect di tiap halaman.

---

## 4. ATURAN EFISIENSI RESOURCE & REFACTORING (Sangat Penting)

### a. Pemisahan Server Component vs Client Component — WAJIB

Pola **lama** di repo ini (`prediction-table.tsx`, `datasets-table.tsx`, `section-cards.tsx`, `chart-area-interactive.tsx`) semuanya `"use client"` + `useEffect` fetch saat mount. Pola ini **dilarang untuk fetch data awal** mulai sekarang.

Aturan baru:
- `page.tsx`, `layout.tsx`, navbar/sidebar statis, **fetch data awal** → **Server Component** (default, tanpa `"use client"`).
- Hanya beri `"use client"` pada unit yang benar-benar butuh interaktivitas browser:
  - Modal/Dialog validasi (`VerificationModal`)
  - Form (login, catatan admin)
  - State lokal (toggle, dropdown, tombol dengan loading state)
- Pola wajib untuk setiap halaman data baru:
  ```tsx
  // app/dashboard/kurasi-ai/page.tsx — SERVER COMPONENT
  export default async function KurasiAiPage({ searchParams }) {
    const page = Number(searchParams.page ?? 1)
    const data = await fetchServer(`/admin/predictions?page=${page}&limit=20`)
    return <PredictionCardGrid initialData={data} />
  }
  ```
- Komponen yang lama (`SectionCards`, `ChartAreaInteractive`) **boleh tetap dipertahankan untuk Dashboard utama**, tapi saat direfaktor, pindahkan fetch awalnya ke Server Component pembungkus dan kirim sebagai props — sisakan `"use client"` hanya untuk bagian yang benar-benar interaktif (mis. `ToggleGroup` rentang waktu di chart).

### b. Komponen `<Image />` Wajib untuk Semua Foto Durian

- Jangan pernah pakai `<img>` mentah di Card maupun Modal.
- `next.config.ts` saat ini **kosong** — sebelum thumbnail durian bisa tampil, tambahkan:
  ```ts
  // next.config.ts
  const nextConfig: NextConfig = {
    images: {
      remotePatterns: [
        { protocol: 'https', hostname: '**.your-storage-domain.com' },
        // tambahkan hostname storage backend yang sebenarnya di sini
      ],
    },
  }
  ```
- Selalu set `width`/`height` atau gunakan `fill` di dalam container beraspek rasio fixed (`aspect-square`/`aspect-video`) agar tidak terjadi *layout shift*.
- Thumbnail di Card: ukuran kecil + `sizes` yang sesuai grid (mis. `sizes="(max-width: 768px) 50vw, 25vw"`). Gambar full di Modal: ukuran lebih besar, boleh `priority` karena hanya satu yang tampil saat modal terbuka.

### c. Pagination Efisien — Wajib

- **Dilarang** mengulang pola lama: `useState(page)` di Client Component + refetch manual via `useEffect`. Pola ini membuat halaman selalu mulai kosong (butuh round-trip tambahan) dan tidak bisa di-bookmark/share URL-nya.
- Pola baru: pagination dikendalikan lewat **`searchParams` URL** (`?page=2`), dibaca di Server Component, link "Next/Prev" pakai `<Link href="?page=...">` biasa (Next.js otomatis prefetch).
- Komponen `DataTable` lama (`src/components/ui/data-table.tsx`) sudah punya pola Prev/Next yang benar secara visual (`canPrev`/`canNext` dari `pageCount`/`currentPage`) — **logika tombolnya boleh dipakai ulang** untuk Card Grid, tapi sumber `currentPage` harus dari `searchParams`, bukan `useState`.
- Limit per halaman untuk Card Grid: mulai dari 12–24 item (kelipatan kolom grid), bukan 10 seperti tabel teks dulu — sesuaikan dengan jumlah kolom grid responsif.

### d. Reusability & Dead Code — Wajib Dibersihkan

Sebelum menulis komponen baru, cek dulu apakah primitive yang relevan sudah ada di `src/components/ui/`. Daftar yang **wajib dihapus** karena sudah terverifikasi tidak dipakai atau out of scope (lihat audit lengkap di `claude.md`):

- Dependency: `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (0 pemakaian, hapus dari `package.json`).
- Setelah Card Grid menggantikan tabel: `src/components/ui/table.tsx`, `src/components/ui/data-table.tsx`, dependency `@tanstack/react-table` (cek dulu tidak ada consumer lain sebelum hapus).
- File: `nav-documents.tsx`, `nav-secondary.tsx`, `breadcrumb.tsx`, `checkbox.tsx`, `drawer.tsx`.
- Modul dataset lama: `dataset.service.ts`, `dataset.types.ts`, `datasets-table.tsx` (arsipkan, jangan hapus permanen dari history git — mungkin dipakai lagi jika scope berkembang).

Sebelum membuat fungsi util baru, cek `src/core/lib/format.ts` dan `src/core/lib/utils.ts` dulu — kemungkinan besar sudah ada (`formatDate`, `formatNumber`, `formatPercent`, `cn`).

---

## 5. Konvensi Struktur Folder (Pertahankan yang Sudah Ada)

```
src/
  app/                          → route segments (Server Component by default)
    dashboard/page.tsx
    dashboard/kurasi-ai/page.tsx        (BARU)
    dashboard/export-dataset/page.tsx   (BARU)
  components/
    dashboard/                  → komponen spesifik fitur dashboard (sidebar, header, chart)
    kurasi-ai/                  → BARU: prediction-card.tsx, verification-modal.tsx
    export-dataset/             → BARU: export-button.tsx
    login/
    ui/                         → primitive shadcn, jangan taruh logic bisnis di sini
  core/
    api/                        → api-client.ts (client), server-client.ts (server, BARU)
    services/                   → satu file per domain (prediction, auth, ai-health)
    types/                      → satu file per domain
    hooks/
    lib/
    constants/
    validations/                → zod schema
```

Penamaan file: `kebab-case.tsx` untuk file, `PascalCase` untuk nama komponen/export — konsisten dengan kode yang sudah ada.

---

## 6. Gaya Kode

- Komentar inline pakai **Bahasa Indonesia**, mengikuti gaya yang sudah ada di kode (contoh: `// Minta parent untuk reload data agar baris diperbarui`).
- Error handling: selalu `err instanceof Error ? err.message : 'pesan default Bahasa Indonesia'` — pola ini sudah konsisten dipakai di service-service lama, pertahankan.
- Notifikasi: pakai `sonner` (`toast.success`/`toast.error`) — sudah terpasang global di `layout.tsx`, jangan tambah library notifikasi lain.
- Validasi form: pakai `zod`, contoh pola di `src/core/validations/auth.schema.ts`.

---

## 7. Checklist Sebelum Commit (Performance & Correctness)

- [ ] Tidak ada `"use client"` di komponen yang sebenarnya tidak butuh state/event handler.
- [ ] Setiap gambar durian pakai `<Image />`, bukan `<img>`.
- [ ] `next.config.ts` punya `images.remotePatterns` yang mengizinkan domain storage backend.
- [ ] Pagination dikendalikan via `searchParams`, bukan `useState` lokal yang reset saat reload.
- [ ] Setiap call API menyertakan `Authorization: Bearer <token>` (cek lewat Network tab atau log interceptor).
- [ ] Tidak ada harga pasar yang ter-render di Card/Modal Kurasi AI.
- [ ] Tidak menambah dependency baru tanpa memverifikasi belum ada solusi dari shadcn/Tailwind/lib yang sudah terpasang.
- [ ] `npm run lint` bersih (ESLint config sudah ada di `eslint.config.mjs`).