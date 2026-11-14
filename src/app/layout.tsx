import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Defect Monitor", template: "%s · Defect Monitor" },
  description: "Monitoring defect per fase pengujian",
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
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${themeClass} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
