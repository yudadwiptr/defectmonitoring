import type { Status } from "./constants";

export interface StatusSnapshot {
  status: string;
  reopenCount: number;
  fixedAt: Date | null;
  closedAt: Date | null;
}

export interface StatusTransition {
  data: {
    status: Status;
    reopenCount: number;
    fixedAt: Date | null;
    closedAt: Date | null;
  };
  history: { fromStatus: string; toStatus: Status; changedAt: Date };
}

/**
 * Aturan perubahan status (murni, tanpa DB) supaya mudah diuji:
 * - Reopened menambah reopen_count dan mengosongkan closed_at
 * - Fixed mengisi fixed_at
 * - Closed mengisi closed_at
 * - keluar dari Closed/Rejected mengosongkan closed_at
 * Mengembalikan null jika status tidak berubah.
 */
export function applyStatusTransition(
  current: StatusSnapshot,
  to: Status,
  now: Date = new Date(),
): StatusTransition | null {
  if (current.status === to) return null;

  let reopenCount = current.reopenCount;
  let fixedAt = current.fixedAt;
  let closedAt = current.closedAt;

  if (to === "Reopened") {
    reopenCount += 1;
    closedAt = null;
  } else if (to === "Fixed") {
    fixedAt = now;
  } else if (to === "Closed") {
    closedAt = now;
  } else if (current.status === "Closed" || current.status === "Rejected") {
    closedAt = null;
  }

  return {
    data: { status: to, reopenCount, fixedAt, closedAt },
    history: { fromStatus: current.status, toStatus: to, changedAt: now },
  };
}
