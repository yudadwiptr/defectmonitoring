"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const items = [
    { href: base, label: "Dashboard", exact: true },
    { href: `${base}/defects`, label: "Defect" },
    { href: `${base}/exit-criteria`, label: "Exit criteria" },
    { href: `${base}/report`, label: "Laporan" },
    { href: `${base}/settings`, label: "Pengaturan" },
  ];

  return (
    <nav aria-label="Menu project" className="flex items-center gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
