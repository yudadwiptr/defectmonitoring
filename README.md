# Defect Monitor

Web app pengganti Excel defect log untuk tim QA. Fokus: tahu defect bocor di fase mana
(SIT → UAT → BETA → PROD) dan kapan sebuah fase siap naik.

## Fitur saat ini (Milestone 1-5)

- Ekspor Excel dari halaman Defect, mengikuti filter yang sedang aktif. Sheet "Defects" (13 kolom), "Riwayat status", dan "Info".
- Impor Excel (`/projects/<id>/import`): unggah .xlsx, pemetaan kolom otomatis dari nama header (bisa diubah), preview dengan validasi per baris (judul kosong, fase/severity/status tak dikenal, tanggal rusak, kode ganda), pilihan perlakuan kode yang sudah ada (perbarui/lewati/buat baru) dan pembuatan modul otomatis. File hasil ekspor bisa diimpor kembali tanpa kehilangan data (diuji di `src/lib/excel.test.ts`).

- Exit criteria: batas defect open per fase dan severity (matriks, isi cepat Ketat/Normal), kartu "Siap naik / Belum siap" per fase dengan aturan yang gagal, dan banner status fase aktif di dashboard.
- Laporan harian: teks siap salin ke WhatsApp/email (tanggal, fase aktif, total, open per severity, baru dan fixed hari ini, Critical/High yang masih open, status exit criteria). Pembuat teks di `src/lib/daily-report.ts`, diuji unit.

- Dashboard per project: aliran leakage antar fase, kartu ringkasan (total, open, closed, reopen rate, rata-rata umur open), open vs closed per fase, sebaran severity, leakage per modul (fase dasar bisa dipilih), dan sepuluh defect open terlama. Rumus ada di `src/lib/metrics.ts` dan diuji di `src/lib/metrics.test.ts`, termasuk pencocokan dengan angka seed di `prisma/SEED.md`.

- Project: buat, ganti nama, hapus; kelola modul; atur urutan fase (default SIT → UAT → REGRESI → BETA → PROD) dan fase aktif
- Catat defect cepat lewat panel samping (pintasan `N`): judul, modul, severity, fase (default fase aktif), deskripsi, lampiran screenshot (Ctrl+V dari clipboard, drag-drop, atau pilih file)
- List defect: filter fase/severity/status/modul, cari judul atau kode, ubah status langsung dari list (reopen_count, fixed_at, closed_at, dan riwayat status terisi otomatis)
- Halaman detail: edit, lampiran, riwayat status, hapus
- Tema gelap/terang (mengikuti sistem, bisa diganti)

Lampiran disimpan di `public/uploads/<defectId>/` (diabaikan git).

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma 6 + SQLite (dev), portabel ke PostgreSQL
- Tailwind 4 + shadcn/ui, Recharts
- exceljs untuk import/export Excel
- Vitest untuk unit test rumus metrik

## Menjalankan dari clone bersih

```bash
npm install
```

```bash
npm run db:setup
```

```bash
npm run dev
```

`db:setup` membuat `.env` dari `.env.example` (jika belum ada), menjalankan
`prisma generate`, `prisma db push`, dan mengisi seed data contoh
(1 project, 7 modul, 60 defect). Lihat [prisma/SEED.md](prisma/SEED.md) untuk
angka yang diharapkan di dashboard.

## Script lain

| Perintah | Fungsi |
| --- | --- |
| `npm run db:seed` | Isi ulang seed (menghapus data lama) |
| `npm run db:push` | Sinkronkan schema ke database tanpa seed |
| `npm run db:studio` | Buka Prisma Studio |
| `npm test` | Jalankan unit test |
| `npm run lint` | ESLint |

## Pindah ke PostgreSQL

Cukup isi `DATABASE_URL` dengan URL Postgres (`postgresql://...`) lalu jalankan
`npm run db:setup`. Provider dipilih otomatis: `scripts/prisma-schema.mjs` membuat
`prisma/runtime.prisma` dari `prisma/schema.prisma` dengan provider `postgresql`
kalau URL-nya Postgres, atau `sqlite` kalau bukan. Model, kolom, index, dan relasi
identik di kedua database (enum disimpan sebagai string, daftar fase sebagai JSON teks).

## Deploy ke Vercel

SQLite tidak bisa dipakai di Vercel (sistem file hanya-baca dan tidak persisten), jadi
butuh Postgres yang di-hosting, misalnya Neon atau Supabase (gratis), atau Vercel Postgres.

1. Buat database Postgres dan salin connection string-nya.
2. Di Vercel, Settings → Environment Variables, isi:
   - `DATABASE_URL` = `postgresql://...` (wajib)
   - `SEED_IF_EMPTY` = `true` kalau ingin data contoh terisi otomatis saat database masih kosong (opsional)
   - `NEXT_PUBLIC_APP_URL` = `https://nama-app.vercel.app` untuk gambar Open Graph (opsional)
3. Redeploy. Perintah build (`node scripts/build.mjs`) akan memilih provider, menjalankan
   `prisma generate` dan `prisma db push`, seed kalau diminta, lalu `next build`.

Batasan di Vercel: lampiran screenshot disimpan ke folder `public/uploads/`, yang di Vercel
tidak bisa ditulis. Defect tetap tersimpan, tapi lampirannya dilewati dengan peringatan.
Untuk lampiran di hosting serverless, perlu penyimpanan objek (Vercel Blob, S3) yang belum
termasuk MVP.
