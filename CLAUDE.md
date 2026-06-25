# CLAUDE.md — Project Brain
## Durian Variety Classification & Market Intelligence — Web Admin Dashboard

> Dokumen ini adalah sumber kebenaran (source of truth) untuk **visi bisnis, hasil audit kode, dan alur UI/UX** dashboard admin. Untuk aturan teknis/implementasi, lihat `agent.md`.

---

## 1. Ringkasan Eksekutif

Web Admin Dashboard ini adalah **satu-satunya pintu masuk admin** untuk mengelola sistem klasifikasi visual varietas durian. Tujuannya tiga:

1. **Mengawasi kesehatan sistem** secara sekilas (jumlah prediksi, tingkat verifikasi, status model AI).
2. **Human-in-the-Loop (HITL) Curation** — admin memvalidasi hasil prediksi AI (benar/salah) sebagai mekanisme *quality control* sebelum data dipakai untuk retraining model atau ditampilkan ke publik. **Harga pasar TIDAK ditampilkan di sini** — modul ini murni soal keakuratan visual AI, bukan transparansi harga.
3. **Mengekspor dataset terkurasi** — admin mengunduh kumpulan gambar yang sudah divalidasi sebagai ZIP, untuk dipakai retraining model EfficientNet.

Dashboard ini **bukan microservice** dan **bukan sistem baru** — ia adalah klien tipis (thin client) di atas backend NestJS + layanan ML Python yang sudah berjalan. Tidak ada logika bisnis yang boleh dipindahkan ke Next.js; Next.js hanya merender dan memanggil API yang sudah ada.

---

## 2. Hasil Audit Komponen Eksisting

Audit dilakukan dengan membaca seluruh isi `src/app`, `src/components`, `src/core`, `middleware.ts`, `package.json`, dan `next.config.ts` di branch `main`. Repo saat ini adalah scaffold **shadcn "dashboard-01" block** yang sebagian sudah diisi logika asli, sebagian masih boilerplate generik.

### ✅ DIPERTAHANKAN (sudah benar / sesuai arah)

| File | Alasan |
|---|---|
| `src/middleware.ts` | Route guard berbasis cookie `admin_token` sudah benar dan ringan. |
| `src/app/login/page.tsx`, `src/components/login/login-form.tsx` | Form login lengkap dengan validasi client-side, sudah memanggil `AuthService.login`. Fungsional, tidak perlu ditulis ulang. |
| `src/core/services/auth.service.ts`, `src/core/types/auth.types.ts`, `src/core/validations/auth.schema.ts` | Sudah menyimpan `accessToken` ke cookie dan `AuthUser` ke storage. Selaras dengan kebutuhan Bearer token. |
| `src/core/services/prediction.service.ts` | **Sudah 100% selaras** dengan 2 dari 3 endpoint yang Anda sebutkan: `list()` → `GET /admin/predictions`, `verify()` → `PATCH /admin/predictions/:id/verify`. Tidak perlu diubah, hanya perlu dipindah pemanggilannya ke Server Component. |
| `src/core/types/prediction.types.ts` | Tipe `Prediction` sudah punya `imageUrl`, `adminNote`, `isVerified`, `varietyName`, `status` — **persis** field yang dibutuhkan Card dan Modal Validasi. Tidak perlu diubah. |
| `src/core/services/ai-health.service.ts` | Berguna untuk kartu "Status Model AI" di halaman Dashboard utama. Pertahankan. |
| `src/core/lib/format.ts`, `src/core/lib/utils.ts` (`cn`) | Utilitas generik, aman dan reusable. |
| `src/core/constants/app.constants.ts` (`DURIAN_VARIETIES`) | Bisa dipakai untuk dropdown filter varietas di Kurasi AI. |
| `src/components/dashboard/section-cards.tsx`, `chart-area-interactive.tsx` | Fungsional untuk ringkasan & tren di halaman **Dashboard** (bukan Kurasi AI). Pertahankan sebagai isi halaman Dashboard, tapi pola fetch-nya perlu direfaktor (lihat bagian REFAKTOR). |
| `src/components/dashboard/nav-user.tsx` | Logic logout sudah benar dan terhubung ke `AuthService.logout`. |
| Primitives shadcn yang aktif dipakai: `button`, `card`, `badge`, `input`, `label`, `field`, `select`, `sheet`, `dropdown-menu`, `sidebar`, `skeleton`, `sonner`, `toggle-group`, `separator`, `avatar`, `chart` | Design system dasar, pertahankan. |

### ♻️ HARUS DIREFAKTOR (arahnya benar, implementasinya belum sesuai spek baru)

| File | Masalah | Arah Refaktor |
|---|---|---|
| `src/core/api/api-client.ts` | Memakai env var `NEXT_PUBLIC_API_URL` (seharusnya `NEXT_PUBLIC_API_BASE_URL`), dan murni axios client-side — tidak bisa dipanggil dari Server Component. | Ganti nama env var. Buat **dua jalur fetch**: instance axios client (tetap, untuk Modal/interaksi) + util `fetchServer()` baru yang jalan di server pakai `INTERNAL_API_BASE_URL` + token dari `cookies()`. Detail di `agent.md`. |
| `src/components/dashboard/prediction-table.tsx` | Menampilkan data dengan **tabel teks** (`@tanstack/react-table`) dan fetch 100% di client via `useEffect`. | Bongkar total → jadi **Card Grid** (lihat alur UI/UX di bagian 3). Fetch awal pindah ke Server Component di `app/dashboard/kurasi-ai/page.tsx`, hanya Modal validasi yang jadi Client Component. |
| `src/components/dashboard/app-sidebar.tsx` | 5 menu generik template (`Lifecycle`, `Analytics`, `Projects`, `Team`) + branding dummy "Acme Inc." + tombol "Quick Create"/"Inbox" yang tidak fungsional. | Sederhanakan jadi **persis 3 menu**: Dashboard, Kurasi AI, Export Dataset. Ganti branding ke nama produk sebenarnya. |
| `src/components/dashboard/site-header.tsx` | `PAGE_TITLES` memetakan 14 rute lama yang sebagian besar tidak akan dibuat. | Sederhanakan jadi 3 entri saja. |
| `src/core/hooks/use-current-user.ts` | Bergantung pada `localStorage` murni client-side → rawan *hydration mismatch* dan tidak bisa dibaca Server Component. | Untuk MVP boleh tetap dipakai di Client Component (NavUser), tapi jangan dijadikan sumber data untuk halaman yang butuh SSR. Catat sebagai utang teknis. |
| `next.config.ts` | Masih kosong, belum ada `images.remotePatterns`. | **Wajib** ditambahkan domain storage backend, atau `<Image />` akan gagal me-render thumbnail durian dari URL eksternal. |
| Halaman `app/dashboard/page.tsx` (tab "Prediksi" & "Dataset") | Tab ini menampilkan ulang tabel prediksi & dataset yang sekarang punya halaman sendiri (Kurasi AI, Export Dataset). | Hapus kedua `TabsContent` dan komponen `Tabs` itu sendiri. Dashboard utama cukup berisi `SectionCards` + `ChartAreaInteractive`. |

### 🗑️ TIDAK DIPERLUKAN (out of scope / boros resource — hapus)

| Item | Alasan |
|---|---|
| `src/components/dashboard/nav-documents.tsx` | Menu dummy "Documents" (Data Library, Reports, Word Assistant) dengan dropdown Open/Share/Delete yang tidak terhubung ke apa pun. Sepenuhnya di luar 3-menu spec. |
| `src/components/dashboard/nav-secondary.tsx` | Menu Settings/Get Help/Search — tidak ada di spek 3 menu Anda. |
| `src/components/dashboard/datasets-table.tsx` + `src/core/services/dataset.service.ts` + `src/core/types/dataset.types.ts` | Mengimplementasikan **model dataset CRUD penuh** (create, delete, `bulkAddByConfidence`, `removeItem`, status Draft/Processing/Ready/Failed, multi-dataset). Spek Anda untuk "Export Dataset" hanya butuh **satu tombol unduh ZIP** dari `GET /admin/predictions/export` — jauh lebih sederhana. **Catatan penting:** ini bukan berarti backend-nya salah (modul `datasets` NestJS Anda mungkin memang dibangun lebih kaya untuk kebutuhan lain) — tapi UI ini **tidak dipanggil** di scope dashboard versi sekarang. Jangan dihapus dari backend; cukup jangan diekspos di frontend untuk saat ini. |
| `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (di `package.json`) | **Terverifikasi tidak dipakai sama sekali** di seluruh kode (`grep` di seluruh `src/` nihil). 4 dependency murni menambah ukuran `node_modules` dan `package-lock.json` tanpa manfaat. |
| `src/components/ui/table.tsx`, `src/components/ui/data-table.tsx`, dependency `@tanstack/react-table` | Hanya dipakai oleh `prediction-table.tsx` & `datasets-table.tsx` yang akan diganti Card Grid. Setelah refaktor, tidak ada lagi consumer-nya. |
| `src/components/ui/breadcrumb.tsx`, `checkbox.tsx`, `drawer.tsx` | Hasil `npx shadcn add` yang **tidak pernah diimpor** di manapun (terverifikasi via grep). Tidak memengaruhi bundle produksi karena Next.js tree-shake otomatis, tapi tetap dead code yang baiknya dibersihkan untuk kerapian repo. |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Aset placeholder bawaan `create-next-app`, tidak relevan dengan branding Durian Classifier. |
| `CLAUDE.md` & `AGENTS.md` lama (isi sebelumnya) | Hanya stub generik 1 baris dari tool lain, bukan dokumentasi proyek nyata — digantikan total oleh dokumen ini. |

---

## 3. Alur UI/UX — Menu "Kurasi AI" (Human-in-the-Loop)

Ini adalah jantung dashboard. Alurnya **wajib**:

```
[Server Component: page.tsx]
   └─ Fetch awal: GET /admin/predictions?page=1&limit=20
   └─ Render: Grid of Cards (Server Component, statis per page load)
         │
         │  klik salah satu Card
         ▼
   [Client Component: VerificationModal]
   └─ Dialog terbuka, menampilkan:
         - Gambar full-size
         - ID Scan, waktu scan, label prediksi AI, confidence
         - Pilihan: ✅ Benar  /  ❌ Salah
         - Textarea: Catatan Admin (opsional/wajib tergantung pilihan)
         │
         │  submit
         ▼
   PATCH /admin/predictions/:id/verify
   { isVerified: boolean, adminNote?: string }
         │
         ▼
   Modal tertutup → toast sukses → revalidasi data Card (tanpa reload tabel manual)
```

**Aturan ketat pada Card** (jangan dilanggar saat implementasi):
- Hanya 4 elemen: thumbnail gambar, ID Scan, waktu scan (`createdAt`), label + status prediksi (SUCCESS/FAILED/PENDING).
- **DILARANG** menampilkan harga pasar di Card maupun Modal — modul ini murni soal akurasi visual AI, bukan harga.
- Card untuk status `PENDING` boleh ditampilkan non-interaktif (tidak bisa diklik untuk validasi) karena prediksi belum selesai.
- Card untuk status `FAILED` tetap bisa diklik untuk dicatat sebagai referensi kegagalan model, tapi tombol "Benar" tidak relevan — sembunyikan atau disable.

---

## 4. Alur UI/UX — Menu "Export Dataset"

Halaman paling sederhana di dashboard ini secara sengaja:

```
[Server/Client Component: page.tsx]
   └─ Tombol: "Unduh Dataset Terverifikasi (ZIP)"
         │
         │  klik
         ▼
   GET /admin/predictions/export
   (trigger download langsung — bisa via <a href> langsung ke endpoint
    jika backend mengembalikan file stream, atau via fetch + blob jika
    butuh header Authorization yang tidak bisa dikirim lewat <a>)
```

Tidak ada list dataset, tidak ada draft/ready status, tidak ada form nama dataset. Cukup satu aksi. Jika ke depan kebutuhan berkembang jadi manajemen multi-dataset, modul `datasets` NestJS yang sudah ada bisa diekspos bertahap — tapi itu di luar scope dokumen ini.

---

## 5. Roadmap Implementasi

**Fase 0 — Bersih-bersih (housekeeping)**
- Hapus 4 dependency `@dnd-kit/*` dari `package.json`, jalankan `npm install` ulang.
- Hapus file dead code yang terdaftar di bagian audit (`nav-documents.tsx`, `nav-secondary.tsx`, `breadcrumb.tsx`, `checkbox.tsx`, `drawer.tsx`, SVG placeholder).
- Buat `.env.example` dengan `NEXT_PUBLIC_API_BASE_URL` dan `INTERNAL_API_BASE_URL` (saat ini belum ada file `.env*` sama sekali di repo).

**Fase 1 — Fondasi navigasi & arsitektur fetch**
- Refaktor `app-sidebar.tsx` → 3 menu.
- Sederhanakan `site-header.tsx`.
- Buat util fetch sisi server (`src/core/api/server-client.ts`) yang baca `INTERNAL_API_BASE_URL` + token dari cookie, dipakai oleh Server Component.
- Tambahkan `images.remotePatterns` di `next.config.ts`.

**Fase 2 — Halaman Kurasi AI**
- `app/dashboard/kurasi-ai/page.tsx` (Server Component) — fetch awal + render Card Grid + pagination berbasis `searchParams`.
- `components/kurasi-ai/prediction-card.tsx` (Server Component murni, tanpa state).
- `components/kurasi-ai/verification-modal.tsx` (Client Component) — form validasi + `CancelToken`/`AbortController` jika perlu cegah race condition.
- Hapus `prediction-table.tsx` setelah Card Grid berfungsi penuh.

**Fase 3 — Halaman Export Dataset**
- `app/dashboard/export-dataset/page.tsx` — satu tombol, satu state loading, satu toast hasil.
- Hapus `datasets-table.tsx`, `dataset.service.ts`, `dataset.types.ts` dari pemanggilan aktif (boleh diarsipkan di branch terpisah jika sewaktu-waktu dibutuhkan kembali).

**Fase 4 — Pembersihan Dashboard utama**
- Hapus `Tabs`/`TabsContent` "Prediksi"/"Dataset" dari `app/dashboard/page.tsx`.
- `SectionCards` disesuaikan agar tidak lagi bergantung pada `DatasetService` yang sudah tidak dipakai (ganti kartu "Total Dataset" dengan metrik lain yang relevan, atau hapus kartu itu).

**Fase 5 — Audit performa & QA**
- Cek Lighthouse/Core Web Vitals untuk halaman Kurasi AI (paling berat karena banyak gambar).
- Verifikasi tidak ada `"use client"` yang tidak perlu.
- Verifikasi seluruh request ke backend menyertakan header `Authorization: Bearer <token>`.

---

## 6. Non-Goals (Tegas di Luar Scope)

- Tidak membangun microservice baru — semua logika bisnis tetap di NestJS/Python yang sudah ada.
- Tidak menampilkan data harga pasar di mana pun dalam modul Kurasi AI.
- Tidak membangun manajemen multi-dataset (create/delete/bulk-add) di frontend — cukup satu aksi ekspor.
- Tidak menambah library data-table/drag-and-drop baru — Card Grid cukup pakai CSS Grid/Flexbox bawaan Tailwind.