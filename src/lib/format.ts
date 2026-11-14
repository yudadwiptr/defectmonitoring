const DAY_MS = 24 * 60 * 60 * 1000;

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return dateTimeFmt.format(new Date(d));
}

/** Umur dalam hari penuh sejak tanggal tertentu. */
export function agingDays(since: Date | string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(since).getTime()) / DAY_MS));
}

export function formatAging(days: number): string {
  if (days === 0) return "hari ini";
  if (days === 1) return "1 hari";
  return `${days} hari`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function percent(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits).replace(".", ",")}%`;
}
