// Satu perintah setup database: salin .env jika belum ada, generate client,
// push schema, lalu isi seed. Jalankan dengan `npm run db:setup`.
import { existsSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("> .env dibuat dari .env.example");
}

const steps = [
  "npx prisma generate",
  "npx prisma db push --skip-generate",
  "npx tsx prisma/seed.ts",
];

for (const cmd of steps) {
  console.log(`> ${cmd}`);
  const r = spawnSync(cmd, { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log("Database siap.");
