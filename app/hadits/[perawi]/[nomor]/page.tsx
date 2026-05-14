"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchResult } from "@/app/types/search";

export default function HaditsDetailPage() {
  const router = useRouter();
  const [hadits, setHadits] = useState<SearchResult | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const storedHadits = sessionStorage.getItem("selectedHadits");
    if (storedHadits) {
      setHadits(JSON.parse(storedHadits));
    } else {
      setIsError(true);
    }
  }, []);

  /**
   * Ekstrak keyword dari preview lalu split terjemahan jadi segmen [{ text, highlight }].
   *
   * Bug yang diperbaiki dari versi lama (regex replace di markdown string):
   *  1. Partial-word match  — "jamaah" cocok di dalam "berjamaah" → "ber**jamaah**"
   *  2. Double-wrap         — kata yang sudah di-bold kena replace lagi → "****shalat****"
   *  3. Regex special chars — keyword mengandung "(", "." menyebabkan crash/salah match
   *
   * Sekarang: tidak ada markdown string, tidak ada replace berantai.
   * Terjemahan di-split jadi segmen React langsung → aman 100%.
   */
  const getHighlightedSegments = (): { text: string; highlight: boolean }[] => {
    if (!hadits?.terjemahan) return [];
    const text = hadits.terjemahan;

    if (!hadits.preview || hadits.preview === hadits.terjemahan) {
      return [{ text, highlight: false }];
    }

    const boldMatches = hadits.preview.match(/\*\*(.*?)\*\*/g);
    if (!boldMatches) return [{ text, highlight: false }];

    const keywords = Array.from(
      new Set(
        boldMatches
          .map((m) => m.replace(/\*\*/g, "").trim())
          .filter((w) => w.length > 1)
      )
    );
    if (keywords.length === 0) return [{ text, highlight: false }];

    // Escape regex special chars di setiap keyword
    const escaped = keywords.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );

    // Whole-word boundary: didahului spasi/awal-string, diikuti spasi/tanda-baca/akhir
    const pattern = new RegExp(
      `((?<=^|[\\s])(?:${escaped.join("|")})(?=[\\s.,;:!?"'\\)]|$))`,
      "gi"
    );

    const segments: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), highlight: false });
      }
      segments.push({ text: match[0], highlight: true });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), highlight: false });
    }

    return segments.length > 0 ? segments : [{ text, highlight: false }];
  };

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-lg text-muted-foreground mb-4">
          Data hadits tidak ditemukan di sesi ini.
        </p>
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-primary px-6 py-2 text-white hover:bg-primary/90"
        >
          Kembali ke Pencarian
        </button>
      </div>
    );
  }

  if (!hadits) return null;

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <div className="w-full px-6 lg:px-12 py-12">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {hadits.referensi_lengkap}
          </h1>
          <p className="text-base text-muted-foreground mb-10">
            Diriwayatkan oleh {hadits.nama_perawi}
          </p>

          <div className="mb-12 rounded-3xl bg-muted/50 dark:bg-zinc-900/50 p-8 sm:p-12 border border-border/40">
            <p
              className="text-right text-xl sm:text-2xl leading-[2.5] font-medium"
              dir="rtl"
            >
              {hadits.arab}
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-4 border-b border-border/40 pb-2">
              Terjemahan
            </h2>
            <div className="text-lg leading-relaxed text-foreground/90">
              <p>
                {getHighlightedSegments().map((seg, i) =>
                  seg.highlight ? (
                    <mark
                      key={i}
                      className="font-bold not-italic text-primary dark:text-sky-400 rounded px-1.5 py-0.5"
                      style={{
                        background: "color-mix(in srgb, currentColor 8%, transparent)",
                      }}
                    >
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}