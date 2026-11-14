import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProject, listDefects } from "@/lib/queries";
import { buildExportWorkbook } from "@/lib/excel";

export const dynamic = "force-dynamic";

function one(v: string | null): string | undefined {
  return v === null || v === "" ? undefined : v;
}

/** Ekspor .xlsx mengikuti filter yang sama dengan halaman list. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return new NextResponse("Project tidak ditemukan", { status: 404 });

  const sp = new URL(req.url).searchParams;
  const defects = await listDefects(id, {
    phase: one(sp.get("phase")),
    severity: one(sp.get("severity")),
    status: one(sp.get("status")),
    moduleId: one(sp.get("module")),
    q: one(sp.get("q")),
    scope: sp.get("scope") === "all" ? "all" : "open",
  });
  const ordered = [...defects].sort((a, b) => a.seq - b.seq);

  const history = await prisma.statusHistory.findMany({
    where: { defectId: { in: ordered.map((d) => d.id) } },
    orderBy: [{ changedAt: "asc" }],
    include: { defect: { select: { code: true } } },
  });

  const buffer = await buildExportWorkbook(
    project.name,
    ordered.map((d) => ({
      code: d.code,
      title: d.title,
      description: d.description,
      moduleName: d.module?.name ?? null,
      severity: d.severity,
      phaseFound: d.phaseFound,
      status: d.status,
      assignee: d.assignee,
      reporter: d.reporter,
      createdAt: d.createdAt,
      fixedAt: d.fixedAt,
      closedAt: d.closedAt,
      reopenCount: d.reopenCount,
    })),
    history.map((h) => ({ code: h.defect.code, fromStatus: h.fromStatus, toStatus: h.toStatus, changedAt: h.changedAt })),
  );

  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="defect-${slug}-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
