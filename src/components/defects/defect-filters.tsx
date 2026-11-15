"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Filter, Search, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEVERITIES, STATUSES } from "@/lib/constants";

interface DefectFiltersProps {
  phases: string[];
  modules: { id: string; name: string }[];
  resultCount: number;
}

const selectClass =
  "h-9 rounded-xl border border-input bg-background/90 px-3 text-xs font-medium outline-none transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function DefectFilters({ phases, modules, resultCount }: DefectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scope = params.get("scope") === "all" ? "all" : "open";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Sinkronkan kotak cari saat URL berubah dari luar (mis. tombol Bersihkan)
  const paramQ = params.get("q") ?? "";
  const [prevParamQ, setPrevParamQ] = useState(paramQ);
  if (paramQ !== prevParamQ) {
    setPrevParamQ(paramQ);
    setQ(paramQ);
  }

  function onSearch(value: string) {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => update({ q: value.trim() || null }), 250);
  }

  const hasFilter = ["phase", "severity", "status", "module", "q"].some((k) => params.get(k));

  return (
    <div className="card-surface flex flex-col gap-3 rounded-2xl border p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Cakupan temuan"
          className="inline-flex h-9 items-center rounded-xl border bg-muted/60 p-1 text-xs"
        >
          {(
            [
              ["open", "Sedang Dikerjakan"],
              ["all", "Semua Riwayat"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={scope === value}
              onClick={() => update({ scope: value === "open" ? null : "all", status: null })}
              className={cn(
                "h-full rounded-lg px-3.5 font-semibold transition-all",
                scope === value
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 font-display text-xs font-semibold text-foreground tnum",
              pending && "opacity-60",
            )}
          >
            <Filter className="size-3 text-primary" />
            {resultCount} temuan ditampilkan
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari judul kendala atau kode (mis. DEF-001)…"
            aria-label="Cari defect"
            className="h-9 rounded-xl bg-background/90 pl-9 text-xs"
          />
        </div>

        <select
          aria-label="Filter fase"
          className={selectClass}
          value={params.get("phase") ?? ""}
          onChange={(e) => update({ phase: e.target.value || null })}
        >
          <option value="">Semua Tahap</option>
          {phases.map((p) => (
            <option key={p} value={p}>
              Tahap {p}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter severity"
          className={selectClass}
          value={params.get("severity") ?? ""}
          onChange={(e) => update({ severity: e.target.value || null })}
        >
          <option value="">Semua Tingkat (Severity)</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter status"
          className={selectClass}
          value={params.get("status") ?? ""}
          onChange={(e) => update({ status: e.target.value || null })}
        >
          <option value="">{scope === "open" ? "Semua Status Aktif" : "Semua Status"}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter modul"
          className={selectClass}
          value={params.get("module") ?? ""}
          onChange={(e) => update({ module: e.target.value || null })}
        >
          <option value="">Semua Bagian/Modul</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
          <option value="none">Tanpa Modul</option>
        </select>

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              update({ phase: null, severity: null, status: null, module: null, q: null })
            }
            className="h-9 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X data-icon="inline-start" />
            Reset Filter
          </Button>
        )}
      </div>
    </div>
  );
}
