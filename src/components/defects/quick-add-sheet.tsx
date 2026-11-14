"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DefectForm } from "./defect-form";

interface QuickAddSheetProps {
  projectId: string;
  modules: { id: string; name: string }[];
  phases: string[];
  activePhase: string;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/** Tombol "Catat defect" + panel samping. Pintasan: tekan N di mana saja. */
export function QuickAddSheet({ projectId, modules, phases, activePhase }: QuickAddSheetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} title="Pintasan: N">
        <Plus data-icon="inline-start" />
        Catat defect
      </Button>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="font-display text-lg">Defect baru</SheetTitle>
          <SheetDescription>
            Fase default mengikuti fase aktif ({activePhase}). Screenshot bisa langsung ditempel.
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 py-4">
          {open && (
            <DefectForm
              mode="create"
              projectId={projectId}
              modules={modules}
              phases={phases}
              autoFocusTitle
              defaults={{
                title: "",
                description: "",
                moduleId: "",
                severity: "Medium",
                phaseFound: activePhase,
                assignee: "",
                reporter: "",
              }}
              onSaved={(_res, keepOpen) => {
                if (!keepOpen) setOpen(false);
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
