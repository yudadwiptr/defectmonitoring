# Seed data contoh

`npm run db:seed` mengisi 1 workspace, 1 project (**Portal E-Procurement**, fase aktif **BETA**,
urutan fase SIT → UAT → REGRESI → BETA → PROD), 7 modul, 20 aturan exit criteria, dan 68 defect
dengan riwayat status lengkap. Seed bersifat idempoten: menjalankan ulang menghapus data lama.

## Angka yang diharapkan di dashboard

| Metrik | Nilai |
| --- | --- |
| Total defect | 68 |
| Rejected | 6 |
| Valid (bukan Rejected) | 62 |
| Closed | 42 |
| Open (selain Closed/Rejected) | 20 |
| Defect dengan reopen_count > 0 | 8 |
| Reopen rate | 8 / 62 = 12,9% |

### Per fase

| Fase | Total | Valid | Closed | Open | Rejected |
| --- | --- | --- | --- | --- | --- |
| SIT | 26 | 23 | 22 | 1 | 3 |
| UAT | 22 | 21 | 14 | 7 | 1 |
| REGRESI | 8 | 7 | 5 | 2 | 1 |
| BETA | 12 | 11 | 1 | 10 | 1 |
| PROD | 0 | 0 | 0 | 0 | 0 |

### Leakage

| Fase | Rumus | Nilai |
| --- | --- | --- |
| SIT | (21 + 7 + 11) / (23 + 21 + 7 + 11) | 39 / 62 = 62,9% |
| UAT | (7 + 11) / (21 + 7 + 11) | 18 / 39 = 46,2% |
| REGRESI | 11 / (7 + 11) | 11 / 18 = 61,1% |
| BETA | 0 / (11 + 0) | 0% |

### Open BETA per severity (untuk exit criteria)

Critical 1, High 3, Medium 4, Low 2. Aturan BETA: Critical 0, High 0, Medium 2, Low 3
sehingga status BETA = **Belum siap** (Critical, High, dan Medium melebihi batas).

### Daily report

Dua defect dibuat hari ini (DEF-067, DEF-068) dan dua defect berstatus Fixed hari ini (DEF-060, DEF-062).
