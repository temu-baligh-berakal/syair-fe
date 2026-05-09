"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchResult } from "@/app/types/search";

export default function HaditsDetailPage() {
  const router = useRouter();
  const [hadits, setHadits] = useState<SearchResult | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Ambil data yang disimpan di sessionStorage
    const storedHadits = sessionStorage.getItem("selectedHadits");
    
    if (storedHadits) {
      setHadits(JSON.parse(storedHadits));
    } else {
      // Jika kosong (misal user refresh paksa tab baru), tampilkan error
      setIsError(true);
    }
  }, []);

  const getMergedContent = () => {
    if (!hadits) return "";
    if (!hadits.preview || hadits.preview === hadits.terjemahan) return hadits.terjemahan;

    const boldMatches = hadits.preview.match(/\*\*(.*?)\*\*/g);
    if (!boldMatches) return hadits.terjemahan;

    const keywords = boldMatches.map(m => m.replace(/\*\*/g, ""));
    let finalContent = hadits.terjemahan;

    keywords.forEach(word => {
      const regex = new RegExp(`(${word})`, "gi");
      finalContent = finalContent.replace(regex, "**$1**");
    });

    return finalContent;
  };

  // Tampilan jika data tidak ditemukan
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-lg text-muted-foreground mb-4">Data hadits tidak ditemukan di sesi ini.</p>
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
      <div className="mx-auto max-w-4xl px-6 py-12">
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {hadits.referensi_lengkap}
          </h1>
          <p className="text-lg text-muted-foreground mb-10">Diriwayatkan oleh {hadits.nama_perawi}</p>

          <div className="mb-12 rounded-3xl bg-muted/50 dark:bg-zinc-900/50 p-8 sm:p-12 border border-border/40">
            <p className="text-right text-3xl sm:text-4xl leading-[2.5] font-medium" dir="rtl">
              {hadits.arab}
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-4 border-b border-border/40 pb-2">Terjemahan</h2>
            <div className="text-lg leading-relaxed text-foreground/90">
              <ReactMarkdown
                components={{
                  strong: ({ node, ...props }) => (
                    <span className="font-bold text-primary dark:text-sky-400 bg-primary/5 dark:bg-sky-400/10 px-1.5 py-0.5 rounded" {...props} />
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