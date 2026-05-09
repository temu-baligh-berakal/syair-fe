"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";

type SearchResult = {
  nama_perawi: string;
  nomor_hadits: number;
  referensi_lengkap: string;
  arab: string;
  terjemahan: string;
  score: number;
};

interface LlmSummaryProps {
  query: string;
  results: any[];
  isSearchLoading: boolean;
  cachedSummary?: string | null; // Tambahkan prop ini
  onSummaryGenerated?: (summary: string) => void; // Tambahkan prop ini
}

export default function LlmSummary({ 
  query, 
  results, 
  isSearchLoading, 
  cachedSummary, 
  onSummaryGenerated 
}: LlmSummaryProps) {
  const [summary, setSummary] = useState<string | null>(cachedSummary || null);
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSearchLoading) {
      setSummary(null);
      setDisplayedText("");
      setIsExpanded(false);
      return;
    }

    // 2. Jika tidak ada hasil, jangan lakukan apa-apa
    if (results.length === 0) return;

    // 3. Jika parent mengirimkan cachedSummary, langsung gunakan tanpa fetch
    if (cachedSummary) {
      setSummary(cachedSummary);
      return;
    }

    async function fetchSummary() {
      setLoading(true);
      try {
        const res = await fetch("/api/llm/summarize", { // Pastikan endpoint API Anda sesuai
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, hadits_results: results }),
        });
        const data = await res.json();
        setSummary(data.summary);
        
        onSummaryGenerated?.(data.summary);
      } catch (err) {
        console.error("Gagal rangkum:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [isSearchLoading, results, cachedSummary, query]);

  useEffect(() => {
    if (summary && !loading) {
      setIsTyping(true);
      let index = 0;
      const speed = 5;

      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      typingIntervalRef.current = setInterval(() => {
        setDisplayedText(summary.slice(0, index));
        index++;
        if (index > summary.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          setIsTyping(false);
        }
      }, speed);
    }
  }, [summary, loading]);

  if (!isSearchLoading && !loading && !summary && !error && !isTyping)
    return null;

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
                        <strong className="font-semibold text-foreground dark:text-white" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="mb-3 ml-5 list-disc space-y-1" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="mb-3 ml-5 list-decimal space-y-1" {...props} />
                      ),
                      li: ({ node, ...props }) => <li className="mb-0" {...props} />,
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
