"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchResult } from "@/app/types/search";

export default function HaditsDetailPage() {
  const { perawi, nomor } = useParams();
  const router = useRouter();
  const [hadits, setHadits] = useState<SearchResult | null>(null);

  useEffect(() => {
    // Simulasi fetch data berdasarkan perawi & nomor
    // Pastikan API Anda mengirimkan 'preview' dan 'terjemahan' sekaligus
    fetch(`/api/hadits/detail?perawi=${perawi}&nomor=${nomor}`)
      .then(res => res.json())
      .then(data => setHadits(data));
  }, [perawi, nomor]);

  // Fungsi untuk menggabungkan Highlight ke Terjemahan Lengkap (FE logic)
  const getMergedContent = () => {
    if (!hadits) return "";
    if (!hadits.preview || hadits.preview === hadits.terjemahan) return hadits.terjemahan;

    // 1. Ekstrak semua kata yang di-bold (**kata**) dari preview
    const boldMatches = hadits.preview.match(/\*\*(.*?)\*\*/g);
    if (!boldMatches) return hadits.terjemahan;

    // Bersihkan tanda ** untuk mendapatkan kata murni
    const keywords = boldMatches.map(m => m.replace(/\*\*/g, ""));
    let finalContent = hadits.terjemahan;

    // 2. Terapkan kata-kata tersebut ke terjemahan utuh menggunakan Regex
    // Ini menangani kasus stemming karena kita mengambil kata yang sudah di-bold OpenSearch
    keywords.forEach(word => {
      const regex = new RegExp(`(${word})`, "gi");
      finalContent = finalContent.replace(regex, "**$1**");
    });

    return finalContent;
  };

  if (!hadits) return null;

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {hadits.referensi_lengkap}
          </h1>
          <p className="text-lg text-muted-foreground mb-10">Diriwayatkan oleh {hadits.nama_perawi}</p>

          {/* Teks Arab Penuh */}
          <div className="mb-12 rounded-3xl bg-muted/50 dark:bg-zinc-900/50 p-8 sm:p-12 border border-border/40">
            <p className="text-right text-3xl sm:text-4xl leading-[2.5] font-medium" dir="rtl">
              {hadits.arab}
            </p>
          </div>

          {/* Terjemahan Penuh dengan Highlight Merged */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Terjemahan</h2>
            <div className="text-lg leading-relaxed text-foreground/90">
              <ReactMarkdown
                components={{
                  strong: ({ ...props }) => (
                    <span className="font-bold text-primary dark:text-sky-400 bg-primary/5 px-1 rounded" {...props} />
                  ),
                }}
              >
                {getMergedContent()}
              </ReactMarkdown>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}