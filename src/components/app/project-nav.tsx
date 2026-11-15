"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bug, FileSpreadsheet, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import { cn } from "cn";

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const items = [
    { href: base, label: "Ringkasan", icon: LayoutDashboard, exact: true },
    { href: `${base}/defects`, label: "Daftar Temuan", icon: Bug },
    { href: `${base}/exit-criteria`, label: "Syarat Lulus", icon: ShieldCheck },
    { href: `${base}/report`, label: "Laporan Harian", icon: FileSpreadsheet },
    { href: `${base}/settings`, label: "Pengaturan", icon: Settings },
  ];

  return (
    <nav
      aria-label="Menu project"
      className="flex items-center gap-1 overflow-x-auto rounded-full border bg-muted/60 p-1"
    >
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
