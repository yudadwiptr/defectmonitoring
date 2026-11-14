import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="paper-grid flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="font-display text-5xl font-bold">404</p>
      <p className="max-w-sm text-muted-foreground">
        Halaman atau data yang dicari tidak ada. Mungkin sudah dihapus, atau tautannya salah.
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Ke daftar project
      </Button>
    </main>
  );
}
