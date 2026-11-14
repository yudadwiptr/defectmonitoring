"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { SEVERITIES } from "@/lib/constants";
import { saveExitCriteria } from "@/lib/actions/exit-criteria";
import { SEVERITY_CLASS } from "@/components/defects/badges";

interface ExitCriteriaFormProps {
  projectId: string;
  phases: string[];
  /** nilai awal, key `${phase}|${severity}` */
  initial: Record<string, number>;
  /** defect open saat ini, key sama */
  openNow: Record<string, number>;
}

const PRESET_STRICT = { Critical: 0, High: 0, Medium: 0, Low: 2 };
const PRESET_NORMAL = { Critical: 0, High: 0, Medium: 3, Low: 5 };

export function ExitCriteriaForm({ projectId, phases, initial, openNow }: ExitCriteriaFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])),
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const dirty = phases.some((ph) =>
    SEVERITIES.some((sev) => {
      const k = `${ph}|${sev}`;
      const a = values[k] ?? "";
      const b = initial[k] === undefined ? "" : String(initial[k]);
      return a !== b;
    }),
  );

  function set(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function applyPreset(phase: string, preset: Record<string, number>) {
    setValues((prev) => {
      const next = { ...prev };
      for (const sev of SEVERITIES) next[`${phase}|${sev}`] = String(preset[sev]);
      return next;
    });
  }

  function clearPhase(phase: string) {
    setValues((prev) => {
      const next = { ...prev };
      for (const sev of SEVERITIES) next[`${phase}|${sev}`] = "";
      return next;
    });
  }

  function save() {
    const rules = phases.flatMap((ph) =>
      SEVERITIES.map((sev) => {
        const raw = (values[`${ph}|${sev}`] ?? "").trim();
        return { phase: ph, severity: sev, maxOpen: raw === "" ? null : Number(raw) };
      }),
    );
    startTransition(async () => {
      const res = await saveExitCriteria(projectId, rules);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-3 font-medium">Fase</th>
              {SEVERITIES.map((sev) => (
                <th key={sev} className="px-2 py-2 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", SEVERITY_CLASS[sev].dot)} />
                    {sev}
                  </span>
                </th>
              ))}
              <th className="py-2 pl-2 text-right font-medium">Isi cepat</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((ph) => (
              <tr key={ph} className="border-b last:border-b-0">
                <td className="font-display py-2 pr-3 font-semibold">{ph}</td>
                {SEVERITIES.map((sev) => {
                  const k = `${ph}|${sev}`;
                  const v = values[k] ?? "";
                  const open = openNow[k] ?? 0;
                  const over = v !== "" && open > Number(v);
                  return (
                    <td key={sev} className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={9999}
                          inputMode="numeric"
                          value={v}
                          placeholder="–"
                          aria-label={`Maks open ${sev} di ${ph}`}
                          onChange={(e) => set(k, e.target.value)}
                          className={cn(
                            "h-8 w-16 rounded-lg border border-input bg-background px-2 text-sm tnum outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                            over && "border-sev-critical/60",
                          )}
                        />
                        <span
                          className={cn("w-10 text-xs tnum", over ? "font-semibold text-sev-critical" : "text-muted-foreground")}
                          title="Defect open saat ini"
                        >
                          {open} open
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td className="py-2 pl-2 text-right whitespace-nowrap">
                  <Button variant="ghost" size="xs" onClick={() => applyPreset(ph, PRESET_STRICT)}>
                    Ketat
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => applyPreset(ph, PRESET_NORMAL)}>
                    Normal
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => clearPhase(ph)}>
                    Kosongkan
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Kosong berarti severity itu tidak dibatasi. Ketat = 0/0/0/2, Normal = 0/0/3/5 untuk Critical/High/Medium/Low.
      </p>
      <div className="flex justify-end gap-2">
        {dirty && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() =>
              setValues(Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])))
            }
          >
            Batalkan
          </Button>
        )}
        <Button onClick={save} disabled={!dirty || pending}>
          {pending ? "Menyimpan…" : "Simpan exit criteria"}
        </Button>
      </div>
    </div>
  );
}
