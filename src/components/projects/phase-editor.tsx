"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setActivePhase, updatePhases } from "@/lib/actions/projects";

interface PhaseEditorProps {
  projectId: string;
  phases: string[];
  activePhase: string;
  counts: Record<string, { total: number; open: number }>;
}

export function PhaseEditor({ projectId, phases, activePhase, counts }: PhaseEditorProps) {
  const router = useRouter();
  const [list, setList] = useState<string[]>(phases);
  const [newPhase, setNewPhase] = useState("");
  const [pending, startTransition] = useTransition();
  const dirty = list.join("|") !== phases.join("|");

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  }

  function add() {
    const name = newPhase.trim().toUpperCase();
    if (!name) return;
    if (list.includes(name)) {
      toast.error(`Fase ${name} sudah ada`);
      return;
    }
    setList([...list, name]);
    setNewPhase("");
  }

  function save() {
    startTransition(async () => {
      const res = await updatePhases(projectId, list);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function activate(phase: string) {
    startTransition(async () => {
      const res = await setActivePhase(projectId, phase);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="divide-y rounded-xl border">
        {list.map((phase, i) => {
          const c = counts[phase] ?? { total: 0, open: 0 };
          const isActive = phase === activePhase;
          const saved = phases.includes(phase);
          return (
            <li key={phase} className="flex items-center gap-2 px-3 py-2">
              <span className="w-5 text-xs text-muted-foreground tnum">{i + 1}.</span>
              <span className={cn("font-display flex-1 text-sm font-semibold", !saved && "text-primary")}>
                {phase}
                {!saved && <span className="ml-2 text-xs font-normal text-muted-foreground">belum disimpan</span>}
              </span>
              <span className="text-xs text-muted-foreground tnum">
                {c.total} defect, {c.open} open
              </span>
              {saved && (
                <Button
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => !isActive && activate(phase)}
                  disabled={pending || isActive}
                  aria-pressed={isActive}
                >
                  {isActive ? "Fase aktif" : "Jadikan aktif"}
                </Button>
              )}
              <Button size="icon-sm" variant="ghost" aria-label="Naik" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Turun"
                onClick={() => move(i, 1)}
                disabled={i === list.length - 1}
              >
                <ArrowDown />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Hapus fase ${phase}`}
                onClick={() => setList(list.filter((p) => p !== phase))}
                disabled={c.total > 0}
                title={c.total > 0 ? "Fase yang sudah punya defect tidak bisa dihapus" : undefined}
              >
                <X />
              </Button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Input
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
            placeholder="Fase baru, mis. HOTFIX"
            maxLength={20}
            className="h-9 w-48 uppercase"
            aria-label="Nama fase baru"
          />
          <Button type="submit" variant="outline" disabled={!newPhase.trim()}>
            <Plus data-icon="inline-start" />
            Tambah fase
          </Button>
        </form>
        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" onClick={() => setList(phases)} disabled={pending}>
              Batalkan
            </Button>
          )}
          <Button onClick={save} disabled={!dirty || pending}>
            {pending ? "Menyimpan…" : "Simpan urutan fase"}
          </Button>
        </div>
      </div>
    </div>
  );
}
