// Menulis prisma/runtime.prisma dari prisma/schema.prisma dengan provider
// yang cocok untuk DATABASE_URL: postgresql://... -> "postgresql", selain itu
// "sqlite". Semua perintah prisma di package.json memakai file runtime ini,
// jadi schema.prisma (sumber kebenaran, SQLite untuk dev) tidak perlu diubah
// saat deploy ke Postgres.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const SOURCE = "prisma/schema.prisma";
const TARGET = "prisma/runtime.prisma";

// Muat .env sederhana kalau DATABASE_URL belum ada di environment (Prisma juga
// membaca .env, tapi kita butuh nilainya untuk memilih provider).
if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"#]+)"?\s*$/);
    if (m) process.env.DATABASE_URL = m[1].trim();
  }
}

const url = process.env.DATABASE_URL ?? "";
const provider = /^postgres(ql)?:\/\//i.test(url) ? "postgresql" : "sqlite";

const source = readFileSync(SOURCE, "utf8");
const out =
  `// FILE INI DIBUAT OTOMATIS oleh scripts/prisma-schema.mjs dari ${SOURCE}.\n` +
  `// Jangan diedit; ubah ${SOURCE} lalu jalankan \`npm run db:prepare\`.\n\n` +
  source.replace(/provider\s*=\s*"sqlite"/, `provider = "${provider}"`);

if (!existsSync(TARGET) || readFileSync(TARGET, "utf8") !== out) {
  writeFileSync(TARGET, out);
}
console.log(`> prisma/runtime.prisma: provider ${provider}${url ? "" : " (DATABASE_URL belum diset)"}`);
