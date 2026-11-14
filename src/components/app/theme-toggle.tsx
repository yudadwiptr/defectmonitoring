"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE = "dm-theme";

/** Tombol tema. Pilihan disimpan di cookie dan dibaca server saat render berikutnya. */
export function ThemeToggle() {
  function toggle() {
    const html = document.documentElement;
    const currentlyDark =
      html.classList.contains("dark") ||
      (!html.classList.contains("light") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = currentlyDark ? "light" : "dark";
    html.classList.remove("dark", "light");
    html.classList.add(next);
    document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Ganti tema gelap/terang" title="Ganti tema">
      <SunMedium className="hidden dark:block" />
      <MoonStar className="dark:hidden" />
    </Button>
  );
}
