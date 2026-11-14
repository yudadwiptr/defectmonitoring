import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs dimuat apa adanya di server (route ekspor dan action impor)
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: {
      // Lampiran screenshot dikirim lewat server action (FormData)
      bodySizeLimit: "15mb",
    },
  },
  // Aplikasi ini sepenuhnya dinamis (baca DB tiap request), jadi Cache
  // Components sengaja tidak diaktifkan agar halaman tidak perlu Suspense/`use cache`.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
