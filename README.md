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

1. Ubah `provider = "sqlite"` menjadi `provider = "postgresql"` di `prisma/schema.prisma`.
2. Isi `DATABASE_URL` di `.env` dengan URL Postgres.
3. Jalankan `npm run db:setup`.

Model, kolom, index, dan relasi tidak perlu diubah: schema sengaja tidak memakai
tipe khusus SQLite (enum disimpan sebagai string, daftar fase sebagai JSON teks).
