"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, label = "Salin teks" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Laporan disalin. Tinggal tempel di WhatsApp atau email.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard tidak bisa diakses. Blok teksnya lalu salin manual.");
    }
  }

  return (
    <Button onClick={copy}>
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? "Tersalin" : label}
    </Button>
  );
}
