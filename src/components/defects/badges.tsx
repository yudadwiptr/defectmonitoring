import { cn } from "cn";
import type { Severity, Status } from "@/lib/constants";

export const SEVERITY_CLASS: Record<Severity, { pill: string; bar: string; dot: string }> = {
  Critical: {
    pill: "bg-sev-critical/12 text-sev-critical ring-sev-critical/30",
    bar: "bg-sev-critical",
    dot: "bg-sev-critical",
  },
  High: {
    pill: "bg-sev-high/12 text-sev-high ring-sev-high/30",
    bar: "bg-sev-high",
    dot: "bg-sev-high",
  },
  Medium: {
    pill: "bg-sev-medium/15 text-[color-mix(in_oklab,var(--sev-medium)_75%,var(--foreground))] ring-sev-medium/35",
    bar: "bg-sev-medium",
    dot: "bg-sev-medium",
  },
  Low: {
    pill: "bg-sev-low/12 text-sev-low ring-sev-low/30",
    bar: "bg-sev-low",
    dot: "bg-sev-low",
  },
};

export const STATUS_CLASS: Record<Status, { dot: string; text: string; pill: string }> = {
  Open: {
    dot: "bg-st-open",
    text: "text-foreground",
    pill: "bg-st-open/12 text-st-open ring-st-open/25",
  },
  "In Progress": {
    dot: "bg-st-progress",
    text: "text-foreground",
    pill: "bg-st-progress/12 text-st-progress ring-st-progress/25",
  },
  Fixed: {
    dot: "bg-st-fixed",
    text: "text-foreground",
    pill: "bg-st-fixed/12 text-st-fixed ring-st-fixed/25",
  },
  Retest: {
    dot: "bg-st-retest",
    text: "text-foreground",
    pill: "bg-st-retest/15 text-[color-mix(in_oklab,var(--st-retest)_75%,var(--foreground))] ring-st-retest/30",
  },
  Closed: {
    dot: "bg-st-closed",
    text: "text-muted-foreground",
    pill: "bg-st-closed/12 text-st-closed ring-st-closed/25",
  },
  Reopened: {
    dot: "bg-st-reopened",
    text: "text-foreground",
    pill: "bg-st-reopened/12 text-st-reopened ring-st-reopened/25",
  },
  Rejected: {
    dot: "bg-st-rejected",
    text: "text-muted-foreground line-through",
    pill: "bg-muted text-muted-foreground ring-border line-through",
  },
};

function sevClass(s: string) {
  return SEVERITY_CLASS[s as Severity] ?? SEVERITY_CLASS.Low;
}

function stClass(s: string) {
  return STATUS_CLASS[s as Status] ?? STATUS_CLASS.Open;
}

export function SeverityPill({ severity, className }: { severity: string; className?: string }) {
  const c = sevClass(severity);
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold tracking-wide ring-1 ring-inset",
        c.pill,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", c.dot)} />
      {severity}
    </span>
  );
}

export function SeverityDot({ severity, className }: { severity: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", sevClass(severity).dot, className)}
    />
  );
}

export function StatusLabel({ status, className }: { status: string; className?: string }) {
  const c = stClass(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        c.pill,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", c.dot)} />
      {status}
    </span>
  );
}

export function DefectCode({ code, className }: { code: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground tnum",
        className,
      )}
    >
      {code}
    </span>
  );
}
