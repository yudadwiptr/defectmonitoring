"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
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
  "h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari judul atau kode…"
            aria-label="Cari defect"
            className="h-8 w-64 pl-8"
          />
        </div>

        <select
          aria-label="Filter fase"
          className={selectClass}
          value={params.get("phase") ?? ""}
          onChange={(e) => update({ phase: e.target.value || null })}
        >
          <option value="">Semua fase</option>
          {phases.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter severity"
          className={selectClass}
          value={params.get("severity") ?? ""}
          onChange={(e) => update({ severity: e.target.value || null })}
        >
          <option value="">Semua severity</option>
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
          <option value="">{scope === "open" ? "Semua status open" : "Semua status"}</option>
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
          <option value="">Semua modul</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
          <option value="none">Tanpa modul</option>
        </select>

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              update({ phase: null, severity: null, status: null, module: null, q: null })
            }
          >
            <X data-icon="inline-start" />
            Bersihkan
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Cakupan"
          className="inline-flex h-8 items-center rounded-lg bg-muted p-[3px] text-sm"
        >
          {(
            [
              ["open", "Masih open"],
              ["all", "Semua"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={scope === value}
              onClick={() => update({ scope: value === "open" ? null : "all", status: null })}
              className={cn(
                "h-full rounded-md px-3 font-medium transition-colors",
                scope === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={cn("text-sm text-muted-foreground tnum", pending && "opacity-60")}>
          {resultCount} defect
        </p>
      </div>
    </div>
  );
}
