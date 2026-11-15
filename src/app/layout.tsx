import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { BRAND } from "./brand";
import { Plus_Jakarta_Sans, Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfitDisplay = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} · ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: ["defect tracking", "QA", "bug log", "defect leakage", "exit criteria", "SIT", "UAT", "regresi", "software testing"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: BRAND.name,
    title: BRAND.name,
    description: BRAND.tagline,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.tagline,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.violet },
    { media: "(prefers-color-scheme: dark)", color: "#111022" },
  ],
};

const THEME_COOKIE = "dm-theme";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Tema dibaca dari cookie di server supaya tidak berkedip dan tanpa inline script.
  // Tanpa cookie: ikut preferensi sistem (lihat color-scheme di globals.css).
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  const themeClass = theme === "dark" ? "dark" : theme === "light" ? "light" : "";

  return (
    <html
      lang="id"
      className={`${jakartaSans.variable} ${geistMono.variable} ${outfitDisplay.variable} ${themeClass} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-primary/20 selection:text-primary">
        <TooltipProvider>{children}</TooltipProvider>
        <footer className="mt-auto border-t bg-card/50 backdrop-blur-xs">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
            <span>{BRAND.name} · Ruang Pantau Kualitas &amp; Rilis Aplikasi</span>
            <span>
              Build by{" "}
              <a
                href="https://yumastudio.digital/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-display font-semibold text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
              >
                yumastudio.digital
              </a>
            </span>
          </div>
        </footer>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
