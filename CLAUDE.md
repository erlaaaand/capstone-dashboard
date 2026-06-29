# CLAUDE.md — Project Brain
## Sistem Klasifikasi Visual Varietas Durian — Web Admin Dashboard

> Dokumen ini adalah sumber kebenaran (source of truth) untuk **visi bisnis, hasil audit kode, dan alur UI/UX** dashboard admin. Untuk aturan teknis/implementasi, lihat `AGENTS.md`.
>
> **Catatan revisi:** Dokumen ini menggantikan `CLAUDE.md` versi sebelumnya secara total. Versi sebelumnya berisi beberapa klaim audit yang **tidak akurat** (mis. menyebut `next.config.ts` "masih kosong", env var "salah nama", `server-client.ts` "belum dibuat") dan masih membahas fitur **Export Dataset** yang per arahan terbaru sudah **dihapus dari backend** dan harus diabaikan sepenuhnya. Audit di dokumen ini ditulis ulang dari nol dengan membaca langsung setiap file di `src/`.

---

## 1. Ringkasan Eksekutif

Web Admin Dashboard ini adalah **satu-satunya pintu masuk admin** untuk mengelola sistem klasifikasi visual varietas durian. Cakupannya disengaja dibuat sangat sempit:

1. **Dashboard** — ringkasan kondisi sistem secara sekilas (jumlah prediksi, tingkat verifikasi, status model AI).
2. **Kurasi AI (Human-in-the-Loop)** — admin memvalidasi hasil prediksi AI (Benar/Salah) sebagai mekanisme *quality control* sebelum data dipercaya. Modul ini **murni soal keakuratan visual AI** — tidak menyentuh harga pasar sama sekali, baik di tampilan maupun di tipe data yang diambil.

Dashboard ini **bukan microservice** dan **bukan sistem baru** — ia adalah klien tipis (thin client) di atas backend NestJS dan layanan ML Python (EfficientNet) yang sudah berjalan. Tidak ada logika bisnis yang dipindahkan ke Next.js; Next.js hanya merender dan memanggil API yang sudah ada.

**Di luar scope secara tegas:** fitur Export/manajemen Dataset. Modul ini sebelumnya direncanakan, sudah punya UI (`datasets-table.tsx`) dan tipe data (`dataset.types.ts`) di repo, **tetapi modul backend-nya sudah dihapus**. Sisa kodenya sekarang adalah dead code yang harus dibersihkan (lihat Bagian 2) — bukan utang teknis yang perlu "dirapikan nanti", melainkan **kode yang sudah tidak punya backend untuk dipanggil**.

---

## 2. Hasil Audit Komponen Eksisting

Audit ditulis ulang dengan membaca **langsung** seluruh isi `src/app`, `src/components`, `src/core`, `middleware.ts`, `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, dan `components.json` di branch `main`. Repo ini adalah scaffold shadcn yang sebagian sudah diisi logika asli (auth, prediction), sebagian masih boilerplate `create-next-app`/template dashboard generik.

### 🔴 Temuan Kritis (memengaruhi apakah proyek bisa di-build)

Ini bukan "selera arsitektur", ini **bug nyata** yang ditemukan saat membaca kode baris per baris:

| Temuan | Detail |
|---|---|
| **Import ke file yang tidak ada** | `src/components/dashboard/datasets-table.tsx` dan `src/components/dashboard/section-cards.tsx` mengimpor `DatasetService` dari `@/src/core/services/dataset.service` — **file ini tidak ada di repo**. Hanya `dataset.types.ts` yang ada, service-nya tidak pernah dibuat/sudah terhapus. Kedua komponen ini akan gagal build selama masih diimpor di `app/dashboard/page.tsx`. |
| **Dependency dipakai di kode tapi tidak dideklarasikan** | `@tanstack/react-table` diimpor di `prediction-table.tsx`, `datasets-table.tsx`, dan `data-table.tsx`, juga `@dnd-kit/*` tercatat di `package-lock.json` — tapi **tidak satu pun muncul di `package.json`**. Kemungkinan besar `package.json` sempat diedit manual tanpa menjalankan `npm install` ulang, sehingga `package-lock.json` basi/tidak sinkron. `npm ci` di environment bersih kemungkinan akan gagal atau menghasilkan state yang tidak konsisten dengan kode sumber. |
| **`components.json` tidak sinkron dengan struktur folder nyata** | `components.json` mendeklarasikan alias `@/components`, `@/lib/utils`, `@/hooks` (tanpa `src/`), tapi **seluruh kode nyata** memakai pola `@/src/components/...`, `@/src/core/...`. Jika `npx shadcn add <komponen>` dijalankan tanpa memperbaiki ini dulu, file baru akan jatuh ke folder yang salah (`/components/ui/` bukan `/src/components/ui/`). |
| **`<img src="/placeholder.svg">` di halaman Login** | `login-form.tsx` memuat `/placeholder.svg` yang **tidak ada** di folder `public/` (isi `public/` hanya 5 SVG bawaan `create-next-app`: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`). Ini broken image di production, sekaligus melanggar aturan wajib `<Image />`. |

### ✅ DIPERTAHANKAN (sudah benar, terverifikasi langsung dari kode)

| File | Alasan |
|---|---|
| `src/middleware.ts` | Route guard berbasis cookie `admin_token`, redirect ke `/login` jika tidak ada token di rute `/dashboard` & `/admin`, dan redirect balik ke `/dashboard` jika sudah login tapi mengakses `/login`. Ringan dan benar. |
| `src/core/api/api-client.ts` | **Sudah memakai `NEXT_PUBLIC_API_BASE_URL`** (bukan nama lama `NEXT_PUBLIC_API_URL` seperti sempat diklaim sebelumnya) — sudah sesuai konvensi final. Interceptor request menambahkan `Authorization: Bearer <token>` dari cookie, interceptor response sudah unwrap `.data` dan menormalkan pesan error NestJS. |
| `src/core/api/server-client.ts` (`fetchServer`) | **Sudah ada dan sudah benar 100%**: pakai `INTERNAL_API_BASE_URL`, ambil token dari `cookies()` Next.js, set header `Authorization` otomatis, `cache: 'no-store'`. **Masalahnya bukan "belum dibuat" — masalahnya fungsi ini punya nol pemakaian di seluruh kodebase.** Tugas utama bukan menulis ulang, tapi mulai memanggilnya dari Server Component. |
| `next.config.ts` | Sudah punya `images.remotePatterns` untuk `127.0.0.1:3001` dan `localhost:3001` (dev), lengkap dengan komentar TODO untuk domain production. Bukan kosong seperti sempat diklaim — hanya belum diisi domain storage production yang sebenarnya. |
| `src/app/login/page.tsx`, `src/components/login/login-form.tsx` | Alur login berfungsi: validasi → `AuthService.login` → simpan cookie + redirect. Validasi manual perlu disambungkan ke `auth.schema.ts` (lihat bagian Refaktor), tapi alurnya jalan. |
| `src/core/services/auth.service.ts`, `src/core/types/auth.types.ts`, `src/core/validations/auth.schema.ts` | Menyimpan `accessToken` ke cookie via `setCookie` dan `AuthUser` ke `localStorage`. Skema zod `loginSchema` sudah benar (email valid + password min 6 char), siap dipakai. |
| `src/core/services/prediction.service.ts` | **Selaras dengan 2 endpoint yang Anda sebutkan**: `list()` → `GET /admin/predictions`, `verify()` → `PATCH /admin/predictions/:id/verify`. Lihat catatan double-unwrap di bagian Refaktor sebelum dipakai apa adanya. |
| `src/core/types/prediction.types.ts` | Field `imageUrl`, `id`, `createdAt`, `varietyName`, `status`, `isVerified`, `adminNote` — **persis** yang dibutuhkan Card dan Modal Validasi. Tidak ada field harga sama sekali. Tidak perlu diubah. |
| `src/core/services/ai-health.service.ts` | Berguna untuk kartu "Status Model AI" di halaman Dashboard. Pertahankan. |
| `src/core/lib/format.ts`, `src/core/lib/utils.ts` (`cn`) | Utilitas generik (`formatDate`, `formatNumber`, `formatPercent`, `percentChange`), aman dan reusable. `formatDate` cocok langsung untuk field waktu scan di Card. |
| `src/core/constants/app.constants.ts` (`DURIAN_VARIETIES`) | Bisa dipakai untuk dropdown filter varietas di Kurasi AI bila dibutuhkan ke depan. |
| `src/components/dashboard/app-sidebar.tsx`, `site-header.tsx` | **Sudah benar secara struktur** — sidebar sudah persis berisi menu sesuai rute yang dibutuhkan (bukan 5 menu template "Acme Inc" seperti yang sempat diklaim), branding sudah "Durian Classifier". `site-header.tsx` `PAGE_TITLES` sudah ringkas (3 entri, bukan 14). **Yang perlu diubah hanya isi daftar menunya** dari 3 jadi 2 (lihat Bagian 3) — bukan dibangun ulang dari nol. |
| `src/components/dashboard/nav-user.tsx` | Logic logout sudah benar dan terhubung ke `AuthService.logout`. |
| `src/components/dashboard/section-cards.tsx`, `chart-area-interactive.tsx` | Pondasi yang tepat untuk halaman **Dashboard**. Pola fetch & satu bug logika trend perlu diperbaiki (lihat Refaktor), tapi struktur kartunya relevan. |
| Primitives shadcn aktif: `button`, `card`, `badge`, `input`, `label`, `field`, `select`, `sheet`, `dropdown-menu`, `sidebar`, `skeleton`, `sonner`, `toggle-group`, `separator`, `avatar`, `chart` | Dipakai nyata di kode, pertahankan. |

### ♻️ HARUS DIREFAKTOR

| File | Masalah Terverifikasi | Arah Refaktor |
|---|---|---|
| `src/app/dashboard/page.tsx` | Server Component yang merender `PredictionsTable` (tabel teks client-side) dan `DatasetsTable` (modul yang sudah tidak punya backend) di dalam `Tabs`. Tidak ada `dashboard/layout.tsx` — sidebar & header dirender langsung di `page.tsx`, jadi rute baru manapun butuh duplikasi sidebar kecuali dipindah ke layout. | Pindahkan `<AppSidebar>`/`<SidebarInset>`/`<SiteHeader>` ke `src/app/dashboard/layout.tsx` baru. Hapus `<Tabs>` dan kedua `TabsContent` beserta importnya. `page.tsx` Dashboard utama tinggal isi `<SectionCards />` + `<ChartAreaInteractive />`. |
| `src/components/dashboard/prediction-table.tsx` | Tabel teks (`@tanstack/react-table`) dengan fetch 100% client-side via `useState`+`useEffect`. Tidak menampilkan harga (aman), tapi format & pola fetch tidak sesuai spek Card Grid. | Bongkar total → jadi **Card Grid** Server Component untuk fetch awal, Modal sebagai satu-satunya Client Component (detail di Bagian 3). |
| `src/components/dashboard/app-sidebar.tsx`, `site-header.tsx` | Sudah benar strukturnya, tapi entri menu masih 3 (termasuk "Export Dataset") sesuai spek versi sebelumnya. | Hapus entri "Export Dataset" dari array `navMain` dan dari `PAGE_TITLES`. Sisakan persis 2: Dashboard, Kurasi AI. |
| `src/components/dashboard/nav-main.tsx` | Berisi tombol dummy "Quick Create" dan ikon "Inbox" (`MailIcon`) yang tidak terhubung ke aksi apa pun — sisa template, bukan kebutuhan admin. Item menu juga di-render lewat `SidebarMenuButton` tanpa `<Link>`/`href`, sehingga klik tidak benar-benar bernavigasi. | Hapus blok "Quick Create"/"Inbox". Bungkus `SidebarMenuButton` dengan `asChild` + `<Link href={item.url}>` agar navigasi App Router berfungsi dan mendapat prefetch otomatis. |
| `src/core/services/prediction.service.ts` | `apiClient` response interceptor di `api-client.ts` sudah `return response.data`, tapi `list()`/`verify()` di service ini masih mengakses `.data` sekali lagi (`response.data`). Berpotensi double-unwrap saat runtime meski TypeScript tidak memprotes karena tipe generik axios. | Verifikasi nilai aktual saat runtime (log sekali saat integrasi pertama); kemungkinan besar hapus `.data` ekstra di kedua method. |
| `src/components/login/login-form.tsx` | Validasi manual (regex email sendiri, cek password hanya `!password`) padahal `loginSchema` (zod) sudah ada dan lebih lengkap. Juga masih ada teks "Acme Inc", 3 tombol login sosial `disabled`, link `href="#"` untuk "Forgot password"/"Sign up"/Terms/Privacy, dan `<img src="/placeholder.svg">` yang rusak. | Ganti validasi manual dengan `loginSchema.safeParse()`. Hapus tombol sosial, link dummy, dan gambar ilustrasi rusak — atau ganti dengan ilustrasi/gambar branding asli via `next/image`. Ganti semua teks ke Bahasa Indonesia konsisten dengan rest of app. |
| `src/components/dashboard/section-cards.tsx` | (a) Memanggil `DatasetService` yang **tidak ada filenya** — akan gagal build. (b) Kartu "Total Dataset" otomatis tidak relevan lagi. (c) Bug logika: "trend" Total Prediksi dihitung dengan membagi 50 data terakhir jadi dua paruh array dan membandingkan **panjang array**-nya (`recentWindow.length` vs `olderWindow.length`) — bukan tren waktu yang sesungguhnya, hasilnya akan selalu mendekati 0% atau 100% secara struktural, bukan refleksi data asli. | Hapus seluruh pemanggilan `DatasetService` dan kartu "Total Dataset". Ganti kartu itu dengan metrik lain yang relevan (mis. jumlah prediksi `PENDING` yang menunggu, atau rata-rata confidence). Hitung ulang logika trend berdasarkan rentang tanggal asli (mis. bandingkan jumlah prediksi 7 hari ini vs 7 hari sebelumnya dari `createdAt`), idealnya agregasi ini dilakukan di backend bila endpoint tersedia. |
| `src/components/dashboard/chart-area-interactive.tsx` | Menarik `limit: 200` record mentah di client lalu mengagregasi per hari di browser (`buildDailySeries`). Berfungsi tapi boros payload untuk dataset besar; agregasi seharusnya idealnya di backend. | Untuk MVP boleh dipertahankan dengan limit yang masuk akal, tapi catat sebagai utang teknis. Jika backend punya/ menambahkan endpoint agregasi harian, pindahkan logika ini ke server. |
| `src/core/hooks/use-current-user.ts` | Bergantung 100% pada `localStorage` → tidak bisa dibaca Server Component, rawan hydration mismatch jika dipanggil saat SSR. | Tetap dipakai di Client Component (`NavUser`) untuk MVP, tapi jangan dijadikan sumber data untuk Server Component manapun. Catat sebagai utang teknis, bukan blocker. |
| `next.config.ts` | Sudah punya `remotePatterns` untuk dev, belum untuk domain storage production (sudah ada komentar TODO di file). | Tambahkan hostname storage backend production sebelum deploy — wajib sebelum thumbnail durian dari server production bisa tampil. |
| `components.json` | Alias (`@/components`, `@/lib/utils`, `@/hooks`) tidak cocok dengan struktur nyata (`@/src/components`, `@/src/core/lib`, `@/src/core/hooks`). | Perbaiki `aliases` di `components.json` agar match struktur nyata **sebelum** menjalankan `npx shadcn add` apa pun (termasuk `dialog` dan `textarea` yang dibutuhkan untuk Modal Validasi — lihat `AGENTS.md`). |
| `package.json` / `package-lock.json` | Tidak sinkron: `@tanstack/react-table` dan `@dnd-kit/*` dipakai/tercatat di lockfile tapi tidak ada di `package.json`. | Putuskan dulu nasib `@tanstack/react-table` (akan dihapus setelah Card Grid jadi, karena tidak ada lagi consumer) dan `@dnd-kit/*` (terverifikasi 0 pemakaian, hapus). Setelah keputusan final, jalankan `npm install` ulang untuk menyinkronkan lockfile, jangan edit `package.json` manual tanpa regenerasi lockfile. |

### 🗑️ TIDAK DIPERLUKAN (out of scope / dead code — hapus)

| Item | Status Verifikasi |
|---|---|
| `src/components/dashboard/datasets-table.tsx` | Mengimpor service yang **sudah tidak ada filenya** (`dataset.service.ts`). Modul backend-nya sudah dihapus sesuai arahan terbaru. Hapus filenya, bukan sekadar arsipkan — tidak ada lagi backend untuk dipanggil. |
| `src/core/types/dataset.types.ts` | Tipe untuk modul yang sudah tidak ada endpoint-nya. Hapus bersamaan dengan `datasets-table.tsx`. |
| `src/components/dashboard/nav-documents.tsx` | **Terverifikasi via grep: 0 pemakaian** di seluruh `src/`. Menu dummy "Documents" dengan dropdown Open/Share/Delete yang tidak terhubung apa pun. |
| `src/components/dashboard/nav-secondary.tsx` | **Terverifikasi via grep: 0 pemakaian.** Menu Settings/Get Help/Search, tidak ada di spek 2-menu. |
| `src/components/dashboard/nav-main.tsx` blok "Quick Create"/"Inbox" | Lihat catatan di Refaktor — bagian render menu utamanya dipertahankan, hanya blok dummy ini yang dihapus. |
| `src/components/ui/table.tsx`, `src/components/ui/data-table.tsx` | Setelah Card Grid menggantikan `prediction-table.tsx` dan `datasets-table.tsx` dihapus, **tidak ada lagi consumer** untuk dua file ini. Hapus bersamaan dengan dependency `@tanstack/react-table`. |
| `src/components/ui/breadcrumb.tsx`, `checkbox.tsx`, `drawer.tsx` | **Terverifikasi via grep: 0 pemakaian** di manapun. Hasil `npx shadcn add` yang tidak pernah dipakai. |
| `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Tercatat di `package-lock.json`, **0 pemakaian** di source code manapun (terverifikasi grep). Hapus dari lockfile dengan menjalankan `npm install` ulang setelah memastikan tidak ada di `package.json`. |
| `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Aset placeholder bawaan `create-next-app`, tidak relevan dengan branding Durian Classifier. |
| Tombol login sosial (Apple/Google/Meta) di `login-form.tsx` | `disabled` permanen, tidak ada rencana implementasi OAuth sosial untuk dashboard admin internal. Hapus, jangan dibiarkan sebagai UI mati. |
| `<img src="/placeholder.svg">` di `login-form.tsx` | File target tidak ada — broken image. Hapus elemen ini atau ganti dengan ilustrasi asli via `next/image`. |
| `CLAUDE.md` & `AGENTS.md` versi sebelumnya | Mengandung beberapa klaim audit yang tidak akurat dan masih membahas fitur Export Dataset yang sudah di luar scope. Digantikan total oleh pasangan dokumen ini. |

---

## 3. Alur UI/UX — Menu "Kurasi AI" (Human-in-the-Loop)

Ini jantung dashboard, dan satu-satunya menu data selain ringkasan Dashboard. Alurnya **wajib**:

```
[Server Component: app/dashboard/kurasi-ai/page.tsx]
   └─ Baca page dari searchParams (?page=1)
   └─ fetchServer(`/admin/predictions?page=${page}&limit=20`)
   └─ Render: Grid of Cards (Server Component, statis per page load)
         │
         │  klik salah satu Card
         ▼
   [Client Component: VerificationModal]
   └─ Dialog terbuka, menampilkan:
         - Gambar full-size (next/image)
         - ID Scan, waktu scan (createdAt), label prediksi AI + status
         - Pilihan: ✅ Benar  /  ❌ Salah
         - Textarea: Catatan Admin
         │
         │  submit
         ▼
   PATCH /admin/predictions/:id/verify
   { isVerified: boolean, adminNote?: string }
         │
         ▼
   Modal tertutup → toast sukses → revalidasi data (router.refresh() atau revalidatePath)
```

**Aturan ketat pada Card** (tidak boleh dilanggar saat implementasi):
- **Hanya 4 elemen**: thumbnail gambar, ID Scan, waktu scan (`createdAt`), label + status prediksi (SUCCESS/FAILED/PENDING).
- **DILARANG MUTLAK** menampilkan data harga pasar di Card maupun Modal — sudah dikonfirmasi `prediction.types.ts` memang tidak punya field harga, jadi secara struktur data pun tidak mungkin bocor ke sini selama tidak ada field baru ditambahkan secara tidak sengaja.
- Card status `PENDING` boleh non-interaktif (tidak bisa diklik untuk validasi) karena prediksi belum selesai diproses model.
- Card status `FAILED` tetap bisa diklik untuk dicatat sebagai referensi kegagalan model, tapi tombol "Benar" tidak relevan — sembunyikan atau disable di Modal.

---

## 4. Roadmap Implementasi

**Fase 0 — Perbaiki yang Rusak (wajib sebelum fitur baru apa pun)**
- Hapus `src/components/dashboard/datasets-table.tsx` dan `src/core/types/dataset.types.ts` (import ke file yang tidak ada — proyek tidak akan build selama ini masih diimpor).
- Hapus pemanggilan `DatasetService` dan kartu "Total Dataset" di `section-cards.tsx`.
- Putuskan nasib `@tanstack/react-table` & `@dnd-kit/*`, lalu jalankan `npm install` ulang agar `package.json` dan `package-lock.json` sinkron kembali.
- Perbaiki `aliases` di `components.json` agar cocok dengan struktur nyata `@/src/...`.
- Buat `.env.example` (belum ada satu pun file `.env*` di repo):
  ```bash
  NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1
  INTERNAL_API_BASE_URL=http://127.0.0.1:3001/api/v1
  ```

**Fase 1 — Fondasi navigasi & layout**
- Buat `src/app/dashboard/layout.tsx`, pindahkan `<AppSidebar>`/`<SidebarInset>`/`<SiteHeader>` ke sini dari `page.tsx`.
- Kurangi `navMain` di `app-sidebar.tsx` dan `PAGE_TITLES` di `site-header.tsx` jadi persis 2 entri: Dashboard, Kurasi AI.
- Hapus blok "Quick Create"/"Inbox" di `nav-main.tsx`; bungkus item menu dengan `<Link href>` agar navigasi App Router berfungsi penuh.
- Tambahkan komponen shadcn yang belum ada: `npx shadcn add dialog textarea` (dipakai Modal Validasi).

**Fase 2 — Halaman Kurasi AI (Card Grid + Modal)**
- `app/dashboard/kurasi-ai/page.tsx` (Server Component) — fetch awal via `fetchServer`, render grid, pagination berbasis `searchParams`.
- `components/kurasi-ai/prediction-card.tsx` (Server Component murni).
- `components/kurasi-ai/verification-modal.tsx` (Client Component) — pakai `dialog` + `textarea` shadcn, panggil `AdminPredictionService.verify`.
- Hapus `prediction-table.tsx` setelah Card Grid berfungsi penuh, lalu hapus `table.tsx`/`data-table.tsx`/`@tanstack/react-table` karena sudah tidak ada consumer.

**Fase 3 — Pembersihan halaman Dashboard utama**
- Hapus `<Tabs>`/`<TabsContent>` "Prediksi"/"Dataset" dari `app/dashboard/page.tsx`. Halaman ini tinggal `<SectionCards />` + `<ChartAreaInteractive />`.
- Perbaiki bug logika "trend" di `section-cards.tsx` agar berbasis rentang tanggal asli, bukan pembagian array.
- Sambungkan `login-form.tsx` ke `loginSchema` (zod) yang sudah ada, hapus tombol sosial, link dummy, dan gambar `/placeholder.svg` yang rusak.

**Fase 4 — Audit performa & QA**
- Cek Lighthouse/Core Web Vitals untuk halaman Kurasi AI (paling berat karena banyak gambar).
- Verifikasi tidak ada `"use client"` yang sebenarnya tidak perlu.
- Verifikasi seluruh request ke backend menyertakan header `Authorization: Bearer <token>` (cek Network tab).
- Tambahkan domain storage backend production ke `next.config.ts` `images.remotePatterns` sebelum deploy.

---

## 5. Non-Goals (Tegas di Luar Scope)

- Tidak membangun microservice baru — semua logika bisnis tetap di NestJS/Python yang sudah ada.
- Tidak menampilkan data harga pasar di mana pun dalam modul Kurasi AI.
- **Tidak membangun ulang fitur Export/manajemen Dataset dalam bentuk apa pun** — modul backend-nya sudah dihapus; sisa kode frontend-nya dihapus, bukan diarsipkan untuk "dipakai lagi nanti".
- Sidebar/navbar hanya 2 menu: Dashboard, Kurasi AI. Tidak menambah menu lain tanpa instruksi baru.
- Tidak menambah library data-table/drag-and-drop baru — Card Grid cukup pakai CSS Grid/Flexbox bawaan Tailwind.