/**
 * Seed data contoh: 1 workspace, 1 project, 7 modul, 68 defect.
 *
 * Angka yang diharapkan (untuk cek manual dashboard, lihat juga prisma/SEED.md):
 *   Total 68 | Rejected 6 | Valid 62 | Closed 42 | Open 20
 *   Per fase (total/valid/closed/open): SIT 26/23/22/1, UAT 22/21/14/7,
 *     REGRESI 8/7/5/2, BETA 12/11/1/10, PROD 0
 *   Reopened (reopen_count>0): 8 -> reopen rate 8/62 = 12.9%
 *   Leakage SIT = (21+7+11)/(23+21+7+11) = 39/62 = 62.9%
 *   Leakage UAT = (7+11)/(21+7+11) = 18/39 = 46.2%
 *   Leakage REGRESI = 11/(7+11) = 61.1%
 *   Leakage BETA = 0/(11+0) = 0%
 *   Open BETA per severity: Critical 1, High 3, Medium 4, Low 2
 *
 * Tanggal relatif terhadap waktu seed dijalankan (c = dibuat N hari lalu,
 * l = perubahan status terakhir N hari lalu) supaya aging dan "hari ini"
 * di daily report selalu masuk akal.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import {
  DEFECTS,
  DEV_BY_MODULE,
  EXIT_CRITERIA,
  MODULES,
  REPORTERS,
  type SeedDefect,
  type St,
} from "./seed-data";

const DAY = 24 * 60 * 60 * 1000;

/** Hari ini jam 09:00 lokal, dikurangi N hari, plus offset jam. */
function daysAgo(now: Date, n: number, hourOffset = 0): Date {
  const d = new Date(now);
  d.setHours(9, 0, 0, 0);
  d.setTime(d.getTime() - n * DAY + hourOffset * 60 * 60 * 1000);
  return d;
}

const FULL_CYCLE: St[] = ["In Progress", "Fixed", "Retest"];

/** Rantai transisi status (tanpa status awal Open). */
function buildChain(status: St, reopens: number): St[] {
  if (status === "Open") return [];
  if (status === "Rejected") return ["Rejected"];

  const chain: St[] = [];
  for (let i = 0; i < reopens; i++) {
    chain.push(...FULL_CYCLE, "Reopened");
  }
  if (status === "Reopened") return chain; // berhenti tepat di Reopened

  const idx = FULL_CYCLE.indexOf(status);
  if (idx >= 0) {
    chain.push(...FULL_CYCLE.slice(0, idx + 1));
  } else if (status === "Closed") {
    chain.push(...FULL_CYCLE, "Closed");
  }
  return chain;
}

function defaultDescription(d: SeedDefect): string {
  return (
    `Ditemukan saat pengujian ${d.phase} pada modul ${d.module}.\n` +
    `Hasil aktual: ${d.title.toLowerCase()}.\n` +
    `Harapan: perilaku sesuai spesifikasi. Lihat lampiran/screenshot bila ada.`
  );
}

async function main() {
  const now = new Date();

  // Reset agar seed idempoten
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: { name: "Workspace Default" },
  });

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Portal E-Procurement",
      phases: JSON.stringify(["SIT", "UAT", "REGRESI", "BETA", "PROD"]),
      activePhase: "BETA",
    },
  });

  const moduleIds = new Map<string, string>();
  for (const name of MODULES) {
    const m = await prisma.module.create({ data: { projectId: project.id, name } });
    moduleIds.set(name, m.id);
  }

  await prisma.exitCriteria.createMany({
    data: EXIT_CRITERIA.map((e) => ({ ...e, projectId: project.id })),
  });

  let seq = 0;
  for (const d of DEFECTS) {
    seq += 1;
    const createdAt = daysAgo(now, d.c, (seq % 5) * 0.5);
    const lastAt = daysAgo(now, d.l ?? d.c, (seq % 5) * 0.5 + 1);
    const chain = buildChain(d.status, d.r ?? 0);

    // Transisi tersebar merata antara createdAt dan lastAt
    const span = Math.max(lastAt.getTime() - createdAt.getTime(), 60 * 60 * 1000);
    const history: Array<{ fromStatus: string | null; toStatus: St; changedAt: Date }> = [
      { fromStatus: null, toStatus: "Open", changedAt: createdAt },
    ];
    let prev: St = "Open";
    let fixedAt: Date | null = null;
    let closedAt: Date | null = null;
    let reopenCount = 0;

    chain.forEach((to, i) => {
      const t = new Date(createdAt.getTime() + (span * (i + 1)) / chain.length);
      history.push({ fromStatus: prev, toStatus: to, changedAt: t });
      if (to === "Fixed") fixedAt = t;
      if (to === "Closed") closedAt = t;
      if (to === "Reopened") {
        reopenCount += 1;
        closedAt = null;
      }
      prev = to;
    });

    const assignee = d.status === "Open" ? null : DEV_BY_MODULE[d.module];
    const reporter = REPORTERS[seq % REPORTERS.length];

    await prisma.defect.create({
      data: {
        projectId: project.id,
        seq,
        code: `DEF-${String(seq).padStart(3, "0")}`,
        title: d.title,
        description: d.description ?? defaultDescription(d),
        moduleId: moduleIds.get(d.module)!,
        severity: d.severity,
        phaseFound: d.phase,
        status: d.status,
        assignee,
        reporter,
        createdAt,
        updatedAt: history[history.length - 1].changedAt,
        fixedAt,
        closedAt,
        reopenCount,
        statusHistory: { create: history },
      },
    });
  }

  const total = await prisma.defect.count();
  console.log(`Seed selesai: project "${project.name}", ${MODULES.length} modul, ${total} defect.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
