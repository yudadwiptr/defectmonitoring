// Build produksi (dipakai Vercel dan `npm run build`):
//   1. pilih provider Prisma sesuai DATABASE_URL
//   2. prisma generate
//   3. prisma db push (kalau DATABASE_URL ada)
//   4. seed kalau database kosong (hanya jika SEED_IF_EMPTY=true)
//   5. next build
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// Build lokal: baca DATABASE_URL dari .env kalau belum ada di environment
if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"#]+)"?\s*$/);
    if (m) process.env.DATABASE_URL = m[1].trim();
  }
}

function run(cmd) {
  console.log(`> ${cmd}`);
  const r = spawnSync(cmd, { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("node scripts/prisma-schema.mjs");
run("npx prisma generate --schema prisma/runtime.prisma");

if (process.env.DATABASE_URL) {
  run("npx prisma db push --skip-generate --schema prisma/runtime.prisma");
  if (/^(1|true|yes)$/i.test(process.env.SEED_IF_EMPTY ?? "")) {
    run("npx tsx prisma/seed.ts --if-empty");
  }
} else {
  console.warn("! DATABASE_URL belum diset: lewati db push. Aplikasi akan gagal membaca database saat dijalankan.");
}

run("npx next build");
