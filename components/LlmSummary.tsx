"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import { SearchResult } from "@/app/types/search";

interface LlmSummaryProps {
  query: string;
  results: SearchResult[];
  isSearchLoading: boolean;
  cachedSummary?: string | null;
  onSummaryGenerated?: (summary: string) => void;
  page?: number;
}

export default function LlmSummary({
  query,
  results,
  isSearchLoading,
  cachedSummary,
  onSummaryGenerated,
  page = 1,
}: LlmSummaryProps) {
  const [summary, setSummary] = useState<string | null>(cachedSummary || null);
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldAnimateTyping, setShouldAnimateTyping] = useState(false);

  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateTypingMode = () => setShouldAnimateTyping(!mediaQuery.matches);

    updateTypingMode();
    mediaQuery.addEventListener("change", updateTypingMode);
    return () => mediaQuery.removeEventListener("change", updateTypingMode);
  }, []);

  useEffect(() => {
    // Jangan jalankan apapun jika bukan di page 1 — termasuk reset state
    if (page !== 1) {
      setSummary(null);
      setDisplayedText("");
      setIsExpanded(false);
      setError(null);
      setLoading(false);
      return;
    }

    if (isSearchLoading) {
      setSummary(null);
      setDisplayedText("");
      setIsExpanded(false);
      setError(null);
      return;
    }

    if (results.length === 0) return;

    if (cachedSummary) {
      setSummary(cachedSummary);
      return;
    }

    if (summary) return; 

    // BUAT ABORT CONTROLLER
    const controller = new AbortController();

    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/llm/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, hadits_results: results }),
          signal: controller.signal, // SAMBUNGKAN SIGNAL ABORT KE FETCH
        });

        if (!res.ok) {
          let message = `HTTP error: ${res.status}`;
          try {
            const errorData = (await res.json()) as { detail?: string; message?: string };
            if (typeof errorData?.detail === "string" && errorData.detail.trim()) message = errorData.detail;
            else if (typeof errorData?.message === "string" && errorData.message.trim()) message = errorData.message;
          } catch {}
          throw new Error(message);
        }

        const data = await res.json();

        const extractText = (): string => {
          if (typeof data === "string") return data;
          if (typeof data?.summary === "string") return data.summary;
          if (typeof data?.result === "string") return data.result;
          if (typeof data?.text === "string") return data.text;
          throw new Error("Format respons tidak dikenali dari server.");
        };

        let cleanText = extractText();
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
          cleanText = cleanText.slice(1, -1);
        }
        cleanText = cleanText.replace(/\\n/g, "\n").replace(/\\"/g, '"');

        if (!cleanText.trim()) throw new Error("Ringkasan kosong diterima dari server.");

        setSummary(cleanText);
        onSummaryGenerated?.(cleanText);
      } catch (err: any) {
        // JIKA ERROR KARENA DIBATALKAN (USER PINDAH PAGE), JANGAN TAMPILKAN ERROR
        if (err.name === "AbortError") {
          console.log("Fetch AI dibatalkan karena user pindah halaman.");
          return;
        }
        
        console.error("[LlmSummary] Gagal rangkum:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat ringkasan.");
      } finally {
        // Pastikan tidak mengubah state loading jika komponen sudah ter-unmount
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchSummary();

    // CLEANUP FUNCTION: Eksekusi Abort jika komponen hilang dari layar (ke page 2)
    return () => {
      controller.abort();
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchLoading, results, cachedSummary, query, page]);
  // Sengaja exclude `summary` dari deps agar tidak infinite loop,
  // tapi kita guard dengan `if (summary) return` di atas.

  useEffect(() => {
    if (summary && !loading) {
      if (!shouldAnimateTyping) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setDisplayedText(summary);
        setIsTyping(false);
        return;
      }

      setIsTyping(true);
      let index = 0;
      const chunkSize = 8;
      const speed = 24;

      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      typingIntervalRef.current = setInterval(() => {
        index = Math.min(summary.length, index + chunkSize);
        setDisplayedText(summary.slice(0, index));
        if (index >= summary.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          setIsTyping(false);
        }
      }, speed);

      return () => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      };
    }
  }, [summary, loading, shouldAnimateTyping]);

  // Sembunyikan card sepenuhnya jika bukan page 1
  if (page !== 1) return null;

  // Hanya hide jika benar-benar tidak ada state apapun yang aktif
  if (!isSearchLoading && !loading && !summary && !error && !isTyping) {
    return null;
  }

  const showShimmer = isSearchLoading || loading;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="summary-container"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8 overflow-hidden rounded-xl border border-border/40 dark:border-white/10 bg-card dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm dark:shadow-xl dark:shadow-black/20"
      >
        <div className="p-5 sm:p-6">
          {/* Header */}
          <motion.div
            className="mb-4 flex items-center gap-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-5 w-5 text-primary dark:text-sky-400" />
            </motion.div>
            <h3 className="text-base font-semibold text-foreground dark:text-white">
              Ringkasan AI
            </h3>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {showShimmer ? (
              <motion.div
                key="shimmer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 py-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    className="h-4 rounded-lg bg-muted dark:bg-zinc-700"
                    style={{ width: `${100 - i * 15}%` }}
                  />
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4"
              >
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={`text-sm sm:text-base leading-relaxed text-foreground/80 dark:text-slate-300 transition-all duration-300 ${
                    !isExpanded ? "line-clamp-6" : ""
                  }`}
                  layout
                  initial={false}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="mb-3 last:mb-0" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="mt-4 mb-2 text-base font-semibold text-foreground dark:text-white"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-semibold text-foreground dark:text-white"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="mb-3 ml-5 list-disc space-y-1" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="mb-3 ml-5 list-decimal space-y-1" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="mb-0" {...props} />
                      ),
                    }}
                  >
                    {displayedText}
                  </ReactMarkdown>
                </motion.div>

                {summary && (
                  <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary dark:text-sky-400 hover:text-primary/80 dark:hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg px-2 py-1 transition-colors"
                    aria-label={isExpanded ? "Collapse summary" : "Expand summary"}
                  >
                    {isExpanded ? "Lebih Sedikit" : "Baca Selengkapnya"}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}