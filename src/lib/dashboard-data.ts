import { prisma } from "./prisma";
import {
  averageOpenAge,
  checkExitCriteria,
  countByPhase,
  countBySeverity,
  leakageByModule,
  leakageByPhase,
  oldestOpen,
  summarize,
} from "./metrics";

/** Semua angka dashboard satu project, dihitung dari satu kali baca defect. */
export async function getDashboardData(
  projectId: string,
  phases: string[],
  activePhase: string,
  basePhase: string,
  now = new Date(),
) {
  const [defects, modules, rules] = await Promise.all([
    prisma.defect.findMany({
      where: { projectId },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        severity: true,
        phaseFound: true,
        moduleId: true,
        createdAt: true,
        reopenCount: true,
        assignee: true,
        module: { select: { name: true } },
      },
    }),
    prisma.module.findMany({ where: { projectId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.exitCriteria.findMany({ where: { projectId } }),
  ]);

  const base = phases.includes(basePhase) ? basePhase : phases[0];

  return {
    now,
    basePhase: base,
    summary: summarize(defects),
    byPhase: countByPhase(defects, phases),
    bySeverity: countBySeverity(defects),
    leakage: leakageByPhase(defects, phases),
    moduleLeakage: leakageByModule(defects, phases, base, modules)
      .filter((m) => m.byPhase.some((n) => n > 0))
      .sort((a, b) => (b.leakage ?? -1) - (a.leakage ?? -1) || b.after - a.after),
    oldest: oldestOpen(defects, now, 10),
    averageAge: averageOpenAge(defects, now),
    exitCheck: checkExitCriteria(defects, rules, activePhase),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
