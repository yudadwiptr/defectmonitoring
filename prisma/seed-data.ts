/**
 * Data seed contoh, dipisah dari seed.ts supaya bisa diimpor unit test
 * (src/lib/metrics.test.ts menghitung metrik langsung dari daftar ini dan
 * membandingkannya dengan prisma/SEED.md).
 */

export type Sev = "Critical" | "High" | "Medium" | "Low";
export type St =
  | "Open"
  | "In Progress"
  | "Fixed"
  | "Retest"
  | "Closed"
  | "Reopened"
  | "Rejected";

export interface SeedDefect {
  title: string;
  module: string;
  severity: Sev;
  phase: string;
  status: St;
  /** dibuat N hari lalu */
  c: number;
  /** transisi status terakhir N hari lalu (default: c) */
  l?: number;
  /** berapa kali di-reopen sebelum mencapai status akhir */
  r?: number;
  description?: string;
}

export const MODULES = [
  "Autentikasi",
  "Dashboard",
  "Pengajuan",
  "Persetujuan",
  "Vendor",
  "Laporan",
  "Pengaturan",
];

export const DEV_BY_MODULE: Record<string, string> = {
  Autentikasi: "Andi",
  Dashboard: "Sari",
  Pengajuan: "Rizky",
  Persetujuan: "Budi",
  Vendor: "Dewi",
  Laporan: "Budi",
  Pengaturan: "Andi",
};

export const REPORTERS = ["Putri (QA)", "Fajar (QA)", "Dwi (QA Lead)"];

export const DEFECTS: SeedDefect[] = [
  // ---------------- SIT (26) ----------------
  { title: "Login gagal saat password mengandung karakter '&'", module: "Autentikasi", severity: "High", phase: "SIT", status: "Closed", c: 70, l: 64,
    description: "Langkah: login dengan password yang mengandung '&'.\nHasil: pesan 'Kredensial salah' walau password benar.\nHarapan: login berhasil. Diduga karakter tidak di-escape saat dikirim ke API." },
  { title: "Token sesi tidak kedaluwarsa setelah logout", module: "Autentikasi", severity: "Critical", phase: "SIT", status: "Closed", c: 70, l: 62,
    description: "Setelah logout, token lama masih bisa dipakai memanggil API /me selama 24 jam. Harapan: token langsung di-revoke." },
  { title: "Tombol 'Lupa password' tidak mengirim email", module: "Autentikasi", severity: "High", phase: "SIT", status: "Closed", c: 69, l: 58, r: 1 },
  { title: "Label menu Dashboard typo 'Dasboard'", module: "Dashboard", severity: "Low", phase: "SIT", status: "Closed", c: 68, l: 66 },
  { title: "Grafik pengajuan bulanan kosong di Firefox", module: "Dashboard", severity: "Medium", phase: "SIT", status: "Closed", c: 68, l: 60 },
  { title: "Angka total pengajuan tidak sesuai filter tanggal", module: "Dashboard", severity: "High", phase: "SIT", status: "Closed", c: 67, l: 59 },
  { title: "Form pengajuan tidak validasi nominal negatif", module: "Pengajuan", severity: "High", phase: "SIT", status: "Closed", c: 66, l: 60 },
  { title: "Lampiran PDF > 5MB gagal upload tanpa pesan", module: "Pengajuan", severity: "Medium", phase: "SIT", status: "Closed", c: 66, l: 58 },
  { title: "Nomor PR duplikat saat submit ganda", module: "Pengajuan", severity: "Critical", phase: "SIT", status: "Closed", c: 65, l: 52, r: 1,
    description: "Klik tombol Submit dua kali cepat menghasilkan dua PR dengan nomor sama. Harapan: tombol disable setelah klik pertama dan nomor unik dijamin di server." },
  { title: "Dropdown kategori barang tidak urut abjad", module: "Pengajuan", severity: "Low", phase: "SIT", status: "Closed", c: 65, l: 62 },
  { title: "Draft pengajuan hilang setelah refresh", module: "Pengajuan", severity: "Medium", phase: "SIT", status: "Closed", c: 64, l: 57 },
  { title: "Approver level 2 bisa approve tanpa level 1", module: "Persetujuan", severity: "Critical", phase: "SIT", status: "Closed", c: 63, l: 55 },
  { title: "Notifikasi approval terkirim dua kali", module: "Persetujuan", severity: "Medium", phase: "SIT", status: "Closed", c: 62, l: 56 },
  { title: "Riwayat persetujuan tidak menampilkan catatan penolakan", module: "Persetujuan", severity: "Medium", phase: "SIT", status: "Closed", c: 61, l: 54 },
  { title: "Tombol Reject aktif meski komentar kosong", module: "Persetujuan", severity: "Low", phase: "SIT", status: "Closed", c: 60, l: 57 },
  { title: "Data vendor tidak tersimpan jika NPWP kosong", module: "Vendor", severity: "High", phase: "SIT", status: "Closed", c: 59, l: 53 },
  { title: "Pencarian vendor case-sensitive", module: "Vendor", severity: "Low", phase: "SIT", status: "Closed", c: 58, l: 56 },
  { title: "Import vendor dari Excel gagal untuk baris dengan koma", module: "Vendor", severity: "Medium", phase: "SIT", status: "Closed", c: 57, l: 46, r: 1 },
  { title: "Export laporan ke Excel kolom tanggal jadi angka", module: "Laporan", severity: "Medium", phase: "SIT", status: "Closed", c: 56, l: 50 },
  { title: "Laporan rekap tidak bisa difilter per departemen", module: "Laporan", severity: "High", phase: "SIT", status: "Closed", c: 55, l: 48 },
  { title: "Pagination laporan loncat ke halaman 1 saat sort", module: "Laporan", severity: "Low", phase: "SIT", status: "Closed", c: 54, l: 52 },
  { title: "Pengaturan email SMTP tidak tersimpan", module: "Pengaturan", severity: "Medium", phase: "SIT", status: "Rejected", c: 53, l: 52,
    description: "Ditolak: konfigurasi SMTP memang dibaca dari environment, bukan dari UI (sesuai keputusan arsitektur)." },
  { title: "Logo perusahaan terpotong di header", module: "Pengaturan", severity: "Low", phase: "SIT", status: "Rejected", c: 52, l: 51,
    description: "Ditolak: logo yang dipakai tester bukan rasio yang didukung (spesifikasi 3:1)." },
  { title: "Halaman profil error 500 saat nama > 100 karakter", module: "Pengaturan", severity: "Medium", phase: "SIT", status: "Closed", c: 51, l: 47 },
  { title: "Loading dashboard > 8 detik di koneksi lambat", module: "Dashboard", severity: "Low", phase: "SIT", status: "Open", c: 50,
    description: "Diuji dengan throttling 3G. Dashboard baru tampil setelah 8-10 detik. Belum diprioritaskan karena Low." },
  { title: "Warning console saat buka form pengajuan", module: "Pengajuan", severity: "Low", phase: "SIT", status: "Rejected", c: 48, l: 47,
    description: "Ditolak: warning berasal dari library pihak ketiga, tidak berdampak ke pengguna." },

  // ---------------- UAT (22) ----------------
  { title: "User non-admin bisa akses menu Pengaturan via URL", module: "Autentikasi", severity: "Critical", phase: "UAT", status: "Closed", c: 44, l: 38,
    description: "User role Staff mengetik /pengaturan langsung di address bar dan halaman terbuka. Harapan: redirect ke 403." },
  { title: "Sesi berakhir saat mengisi form panjang tanpa peringatan", module: "Autentikasi", severity: "Medium", phase: "UAT", status: "Closed", c: 43, l: 36 },
  { title: "Widget 'Menunggu Persetujuan' menghitung PR yang sudah dibatalkan", module: "Dashboard", severity: "High", phase: "UAT", status: "Closed", c: 42, l: 35 },
  { title: "Grafik tren tidak update setelah ganti periode", module: "Dashboard", severity: "Medium", phase: "UAT", status: "Closed", c: 41, l: 30, r: 1 },
  { title: "Nominal pengajuan tidak diformat ribuan", module: "Pengajuan", severity: "Low", phase: "UAT", status: "Closed", c: 40, l: 37 },
  { title: "Pengajuan dengan 20+ item lambat disimpan", module: "Pengajuan", severity: "Medium", phase: "UAT", status: "Closed", c: 39, l: 25 },
  { title: "Field 'Keperluan' menerima emoji, rusak di PDF", module: "Pengajuan", severity: "Low", phase: "UAT", status: "Closed", c: 38, l: 33 },
  { title: "Lampiran bisa dihapus setelah PR disetujui", module: "Pengajuan", severity: "High", phase: "UAT", status: "Closed", c: 37, l: 30 },
  { title: "Approval via link email kedaluwarsa terlalu cepat", module: "Persetujuan", severity: "Medium", phase: "UAT", status: "Closed", c: 36, l: 27 },
  { title: "Delegasi approver tidak berlaku untuk PR lama", module: "Persetujuan", severity: "High", phase: "UAT", status: "Closed", c: 35, l: 24, r: 1 },
  { title: "Komentar approver hilang saat reject kedua", module: "Persetujuan", severity: "Medium", phase: "UAT", status: "Retest", c: 34, l: 6 },
  { title: "Vendor nonaktif masih muncul di dropdown", module: "Vendor", severity: "Medium", phase: "UAT", status: "Closed", c: 33, l: 28 },
  { title: "Rating vendor tidak tersimpan desimal", module: "Vendor", severity: "Low", phase: "UAT", status: "Closed", c: 32, l: 26 },
  { title: "Laporan PDF header terpotong di mode landscape", module: "Laporan", severity: "Low", phase: "UAT", status: "Open", c: 31 },
  { title: "Rekap bulanan salah hitung PR lintas bulan", module: "Laporan", severity: "Critical", phase: "UAT", status: "Closed", c: 30, l: 22,
    description: "PR yang diajukan 30 Sep dan disetujui 2 Okt dihitung di dua bulan sekaligus. Harapan: dihitung di bulan pengajuan saja." },
  { title: "Export laporan > 10.000 baris timeout", module: "Laporan", severity: "High", phase: "UAT", status: "Reopened", c: 29, l: 5, r: 1,
    description: "Perbaikan pertama (pagination server) masih timeout di 25.000 baris. Dibuka kembali oleh QA." },
  { title: "Email notifikasi tanpa nama penerima", module: "Pengaturan", severity: "Low", phase: "UAT", status: "Rejected", c: 28, l: 27,
    description: "Ditolak: template email memang generik sesuai permintaan klien." },
  { title: "Tidak bisa ubah password jika mengandung spasi", module: "Autentikasi", severity: "Medium", phase: "UAT", status: "In Progress", c: 27, l: 8 },
  { title: "Angka KPI dashboard berbeda dengan laporan", module: "Dashboard", severity: "High", phase: "UAT", status: "Fixed", c: 26, l: 4 },
  { title: "Tombol 'Ajukan Ulang' tidak menyalin lampiran", module: "Pengajuan", severity: "Medium", phase: "UAT", status: "Open", c: 25 },
  { title: "Daftar vendor sort by nama tidak konsisten", module: "Vendor", severity: "Low", phase: "UAT", status: "Closed", c: 22, l: 18 },
  { title: "Audit log tidak mencatat perubahan limit approval", module: "Persetujuan", severity: "Medium", phase: "UAT", status: "Retest", c: 20, l: 3 },

  // ---------------- REGRESI (8) ----------------
  { title: "Tombol 'Lupa password' kembali tidak mengirim email setelah patch", module: "Autentikasi", severity: "High", phase: "REGRESI", status: "Closed", c: 19, l: 16,
    description: "Regresi dari DEF-003. Setelah deploy build 1.4.0 email reset tidak terkirim lagi. Diduga konfigurasi mailer tertimpa." },
  { title: "Filter tanggal dashboard reset setelah navigasi", module: "Dashboard", severity: "Medium", phase: "REGRESI", status: "Closed", c: 19, l: 15 },
  { title: "Validasi nominal negatif hilang di form edit pengajuan", module: "Pengajuan", severity: "High", phase: "REGRESI", status: "Closed", c: 18, l: 15,
    description: "Regresi dari DEF-007: validasi masih ada di form buat baru, tapi hilang di form edit." },
  { title: "Riwayat persetujuan urutannya terbalik setelah patch", module: "Persetujuan", severity: "Low", phase: "REGRESI", status: "Closed", c: 18, l: 16 },
  { title: "Pencarian vendor lambat setelah index diubah", module: "Vendor", severity: "Medium", phase: "REGRESI", status: "Fixed", c: 17, l: 3 },
  { title: "Export Excel kolom tanggal kembali jadi angka", module: "Laporan", severity: "Medium", phase: "REGRESI", status: "Closed", c: 17, l: 14, r: 1,
    description: "Regresi dari DEF-019. Perbaikan pertama hanya untuk sheet Rekap, sheet Detail masih salah." },
  { title: "Profil error 500 untuk nama dengan tanda petik", module: "Pengaturan", severity: "Low", phase: "REGRESI", status: "Open", c: 16 },
  { title: "Notifikasi approval terkirim ganda saat retry", module: "Persetujuan", severity: "High", phase: "REGRESI", status: "Rejected", c: 15, l: 14,
    description: "Ditolak: duplikat dari DEF-013, akar masalah sama dan sudah ditangani." },

  // ---------------- BETA (12, fase aktif) ----------------
  { title: "Login SSO gagal untuk akun domain anak perusahaan", module: "Autentikasi", severity: "High", phase: "BETA", status: "In Progress", c: 14, l: 2,
    description: "Akun @sub.perusahaan.co.id ditolak IdP dengan error 'audience mismatch'. Perlu tambah domain ke allowlist." },
  { title: "Dashboard menampilkan data departemen lain", module: "Dashboard", severity: "Critical", phase: "BETA", status: "Closed", c: 13, l: 7, r: 1 },
  { title: "Preview lampiran gambar berorientasi salah", module: "Pengajuan", severity: "Low", phase: "BETA", status: "Open", c: 12 },
  { title: "Submit PR dari mobile Safari tidak merespon", module: "Pengajuan", severity: "High", phase: "BETA", status: "Fixed", c: 11, l: 0 },
  { title: "Notifikasi push approval duplikat", module: "Persetujuan", severity: "Medium", phase: "BETA", status: "Retest", c: 9, l: 1 },
  { title: "Approver bisa menyetujui PR miliknya sendiri", module: "Persetujuan", severity: "Critical", phase: "BETA", status: "Fixed", c: 8, l: 0,
    description: "Manager yang mengajukan PR muncul juga sebagai approver level 1 dan bisa approve. Harapan: sistem melewati approver yang sama dengan pemohon." },
  { title: "Nomor telepon vendor tidak divalidasi formatnya", module: "Vendor", severity: "Low", phase: "BETA", status: "Open", c: 7 },
  { title: "Laporan rekap bulan berjalan lambat (>15 detik)", module: "Laporan", severity: "Medium", phase: "BETA", status: "In Progress", c: 6, l: 2 },
  { title: "Tooltip grafik tertutup header di layar kecil", module: "Dashboard", severity: "Low", phase: "BETA", status: "Rejected", c: 5, l: 4,
    description: "Ditolak: resolusi di bawah 1024px tidak termasuk scope dukungan." },
  { title: "Email reminder approval terkirim tengah malam", module: "Pengaturan", severity: "Medium", phase: "BETA", status: "Open", c: 3 },
  { title: "Total nominal di widget tidak termasuk PR hari ini", module: "Dashboard", severity: "High", phase: "BETA", status: "Open", c: 0 },
  { title: "Upload lampiran .xlsx ditolak padahal diizinkan", module: "Pengajuan", severity: "Medium", phase: "BETA", status: "Open", c: 0 },
];

export const EXIT_CRITERIA: Array<{ phase: string; severity: Sev; maxOpen: number }> = [
  { phase: "SIT", severity: "Critical", maxOpen: 0 },
  { phase: "SIT", severity: "High", maxOpen: 0 },
  { phase: "SIT", severity: "Medium", maxOpen: 5 },
  { phase: "SIT", severity: "Low", maxOpen: 10 },
  { phase: "UAT", severity: "Critical", maxOpen: 0 },
  { phase: "UAT", severity: "High", maxOpen: 0 },
  { phase: "UAT", severity: "Medium", maxOpen: 3 },
  { phase: "UAT", severity: "Low", maxOpen: 5 },
  { phase: "REGRESI", severity: "Critical", maxOpen: 0 },
  { phase: "REGRESI", severity: "High", maxOpen: 0 },
  { phase: "REGRESI", severity: "Medium", maxOpen: 2 },
  { phase: "REGRESI", severity: "Low", maxOpen: 5 },
  { phase: "BETA", severity: "Critical", maxOpen: 0 },
  { phase: "BETA", severity: "High", maxOpen: 0 },
  { phase: "BETA", severity: "Medium", maxOpen: 2 },
  { phase: "BETA", severity: "Low", maxOpen: 3 },
  { phase: "PROD", severity: "Critical", maxOpen: 0 },
  { phase: "PROD", severity: "High", maxOpen: 0 },
  { phase: "PROD", severity: "Medium", maxOpen: 0 },
  { phase: "PROD", severity: "Low", maxOpen: 2 },
];
