// Cek cepat: angka hasil seed harus cocok dengan prisma/SEED.md.
// Jalankan: npx tsx scripts/verify-seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defects = await prisma.defect.findMany({
    select: {
      phaseFound: true,
      status: true,
      severity: true,
      reopenCount: true,
      createdAt: true,
      fixedAt: true,
      code: true,
    },
  });
  const isOpen = (s: string) => s !== "Closed" && s !== "Rejected";
  const valid = defects.filter((d) => d.status !== "Rejected");
  const out: Record<string, unknown> = {
    total: defects.length,
    rejected: defects.length - valid.length,
    valid: valid.length,
    closed: defects.filter((d) => d.status === "Closed").length,
    open: defects.filter((d) => isOpen(d.status)).length,
    reopened: valid.filter((d) => d.reopenCount > 0).length,
  };
  for (const ph of ["SIT", "UAT", "REGRESI", "BETA", "PROD"]) {
    const x = defects.filter((d) => d.phaseFound === ph);
    out[ph] = {
      total: x.length,
      valid: x.filter((d) => d.status !== "Rejected").length,
      closed: x.filter((d) => d.status === "Closed").length,
      open: x.filter((d) => isOpen(d.status)).length,
    };
  }
  const betaOpen = defects.filter((d) => d.phaseFound === "BETA" && isOpen(d.status));
  out.betaOpenBySeverity = Object.fromEntries(
    ["Critical", "High", "Medium", "Low"].map((s) => [
      s,
      betaOpen.filter((d) => d.severity === s).length,
    ]),
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  out.createdToday = defects.filter((d) => d.createdAt >= today).map((d) => d.code);
  out.fixedToday = defects
    .filter((d) => d.fixedAt && d.fixedAt >= today && d.status === "Fixed")
    .map((d) => d.code);
  out.history = await prisma.statusHistory.count();
  out.historyInFuture = await prisma.statusHistory.count({
    where: { changedAt: { gt: new Date() } },
  });
  console.log(JSON.stringify(out, null, 2));
}

main().finally(() => prisma.$disconnect());
