"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import LlmSummary from "@/components/LlmSummary";
import SearchResultItem from "@/components/SearchResultItem";
import SearchSettingsDialog from "@/components/SearchSettingsDialog";
import { SearchMode, SearchResponse, SearchMeta } from "@/app/types/search";
import { formatDuration, normalizeMode, normalizeTopK } from "@/app/lib/search-helpers";
import { Search, ArrowLeft } from "lucide-react";

const exampleQueries = [
  "shalat berjamaah lebih utama",
  "larangan marah",
  "keutamaan menuntut ilmu",
];

function SearchInterface() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const urlMode = normalizeMode(searchParams.get("mode"));
  const urlTopK = normalizeTopK(searchParams.get("topk"));

  const [query, setQuery] = useState(urlQuery);
  const [mode, setMode] = useState<SearchMode>(urlMode);
  const [topK, setTopK] = useState(urlTopK);
  const [draftMode, setDraftMode] = useState<SearchMode>(urlMode);
  const [draftTopK, setDraftTopK] = useState(urlTopK);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const lastFetchedKeyRef = useRef<string | null>(null);
  const urlSearchKey = useMemo(() => {
    return urlQuery ? `${urlQuery}::${urlMode}::${urlTopK}` : null;
  }, [urlMode, urlQuery, urlTopK]);

  useEffect(() => {
    setQuery(urlQuery);
    setMode(urlMode);
    setTopK(urlTopK);
  }, [urlQuery, urlMode, urlTopK]);

  async function runSearch(searchQuery: string, searchMode: SearchMode, searchTopK: number) {
    if (searchQuery.trim().length < 3) {
      setError(null);
      setResponse(null);
      setSearchMeta(null);
      toast.error("Query minimal 3 karakter.", { duration: 1000 });
      return;
    }

    setLoading(true);
    setError(null);
    const startedAt = performance.now();

    try {
      const result = await fetch("/api/hadits/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, top_k: searchTopK, mode: searchMode }),
      });

      const data = (await result.json()) as SearchResponse | { detail?: string };

      if (!result.ok) {
        throw new Error("detail" in data ? data.detail : "Permintaan gagal diproses.");
      }

      setResponse(data as SearchResponse);
      setSearchMeta({ durationMs: performance.now() - startedAt });
    } catch (submitError) {
      setResponse(null);
      setSearchMeta(null);
      setError(submitError instanceof Error ? submitError.message : "Terjadi kesalahan yang tidak diketahui.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!urlSearchKey) {
      setResponse(null);
      setSearchMeta(null);
      setError(null);
      lastFetchedKeyRef.current = null;
      return;
    }

    if (lastFetchedKeyRef.current === urlSearchKey) return;

    lastFetchedKeyRef.current = urlSearchKey;
    void runSearch(urlQuery, urlMode, urlTopK);
  }, [urlMode, urlQuery, urlSearchKey, urlTopK]);

  function navigateToSearch(nextQuery: string, nextMode: SearchMode, nextTopK: number) {
    const trimmedQuery = nextQuery.trim();
    if (trimmedQuery.length < 3) {
      setError(null);
      toast.error("Query minimal 3 karakter.", { duration: 1000 });
      return;
    }

    const params = new URLSearchParams();
    params.set("q", trimmedQuery);
    params.set("mode", nextMode);
    params.set("topk", String(nextTopK));

    const nextUrl = `${pathname}?${params.toString()}`;
    const nextKey = `${trimmedQuery}::${nextMode}::${nextTopK}`;

    if (urlSearchKey === nextKey) {
      lastFetchedKeyRef.current = null;
      void runSearch(trimmedQuery, nextMode, nextTopK);
      return;
    }
    router.push(nextUrl);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateToSearch(query, mode, topK);
  }

  function saveSettings() {
    const normalizedTopK = Number.isNaN(draftTopK) ? topK : Math.min(50, Math.max(1, draftTopK));
    setMode(draftMode);
    setTopK(normalizedTopK);
    setDraftTopK(normalizedTopK);
    setSettingsOpen(false);
    toast.success("Pengaturan berhasil disimpan", {
      description: `Mode ${draftMode} dengan ${normalizedTopK} item aktif.`,
      duration: 1000,
    });
  }

  function handleOpenSettings(open: boolean) {
    if (open) {
      setDraftMode(mode);
      setDraftTopK(topK);
    }
    setSettingsOpen(open);
  }

  const showResults = urlQuery.length >= 3;

  return (
    <>
      <main className="min-h-screen bg-background dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-foreground dark:text-white transition-colors duration-300">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 sm:px-6 pb-12 pt-6">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.section
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-1 flex-col items-center justify-center pb-24 py-12 sm:py-20"
              >
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <img
                    src="/assets/logo.png"
                    alt="Syair"
                    className="select-none w-40 sm:w-56 h-auto"
                  />
                </motion.div>

                {/* Tagline */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="mt-4 text-center text-sm sm:text-base text-muted-foreground dark:text-slate-400 max-w-md"
                >
                  Jelajahi koleksi Hadits dengan teknologi pencarian semantic dan AI-powered
                </motion.p>

                {/* Search Form */}
                <motion.form
                  onSubmit={handleSubmit}
                  className="mt-10 sm:mt-12 w-full max-w-2xl"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <div className="flex w-full items-center gap-2 rounded-full border border-border/40 dark:border-white/10 bg-card dark:bg-zinc-900/80 px-6 py-3 sm:py-4 shadow-sm dark:shadow-xl dark:shadow-black/20 backdrop-blur transition-all focus-within:shadow-md focus-within:border-primary/50 dark:focus-within:border-sky-400/50">
                    <Search className="h-5 w-5 text-muted-foreground dark:text-slate-500 flex-shrink-0" />

                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Cari hadits..."
                      className="flex-1 border-0 bg-transparent text-base outline-none placeholder:text-muted-foreground dark:placeholder:text-slate-500"
                      autoFocus
                    />

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-2 flex items-center justify-center rounded-full bg-primary dark:bg-sky-500 px-6 sm:px-8 py-2.5 text-sm font-medium text-primary-foreground dark:text-white transition-all hover:bg-primary/90 dark:hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Mencari..." : "Cari"}
                    </motion.button>
                  </div>
                </motion.form>

                {/* Example Queries */}
                <motion.div
                  className="mt-8 flex flex-wrap justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {exampleQueries.map((example, idx) => (
                    <motion.button
                      key={example}
                      type="button"
                      onClick={() => setQuery(example)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + idx * 0.08 }}
                      className="rounded-full bg-muted dark:bg-zinc-800/50 border border-border/40 dark:border-white/10 px-4 py-2 text-xs sm:text-sm text-foreground dark:text-slate-300 transition-all hover:bg-muted/80 dark:hover:bg-zinc-700/50 hover:border-primary/20 dark:hover:border-sky-400/30"
                    >
                      {example}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mt-8 w-full max-w-2xl rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            ) : (
              <motion.section
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                {/* Header with logo and search */}
                <motion.div
                  className="sticky top-0 z-40 -mx-4 sm:-mx-6 mb-8 border-b border-border/40 dark:border-white/10 bg-background/80 dark:bg-zinc-950/80 px-4 sm:px-6 py-4 backdrop-blur-md"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="max-w-5xl mx-auto flex items-center gap-3 sm:gap-4">
                    <motion.button
                      type="button"
                      onClick={() => router.push(pathname)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-shrink-0 rounded-lg p-2 hover:bg-muted dark:hover:bg-zinc-800 transition-colors"
                      aria-label="Back to home"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </motion.button>

                    <div className="w-full max-w-2xl">
                      <form onSubmit={handleSubmit} className="w-full">
                        <div className="flex w-full items-center gap-2 rounded-lg border border-border/40 dark:border-white/10 bg-card dark:bg-zinc-900/50 px-4 py-2.5 shadow-sm dark:shadow-lg dark:shadow-black/20 backdrop-blur transition-all focus-within:shadow-md focus-within:border-primary/50 dark:focus-within:border-sky-400/50">
                          <Search className="h-4 w-4 text-muted-foreground dark:text-slate-500 flex-shrink-0" />
                          <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari hadits..."
                            className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground dark:placeholder:text-slate-500"
                          />
                          <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="ml-2 flex items-center justify-center rounded-lg bg-primary dark:bg-sky-500 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground dark:text-white transition-all hover:bg-primary/90 dark:hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {loading ? "..." : "Cari"}
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-6 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Summary */}
                {(loading || response) && (
                  <LlmSummary
                    query={loading ? urlQuery : response?.query || ""}
                    results={response?.results || []}
                    isSearchLoading={loading}
                  />
                )}

                {/* Results */}
                <AnimatePresence mode="wait">
                  {response ? (
                    <motion.div
                      key="results-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.p
                        className="mb-8 text-sm text-muted-foreground dark:text-slate-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Sekitar <span className="font-semibold text-foreground dark:text-white">{response.total}</span> hasil ({searchMeta ? formatDuration(searchMeta.durationMs) : "0,00"} detik) untuk{" "}
                        <span className="font-semibold text-foreground dark:text-white">&ldquo;{response.query}&rdquo;</span>
                      </motion.p>

                      <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.05,
                            },
                          },
                        }}
                      >
                        {response.results.map((item, idx) => (
                          <SearchResultItem
                            key={`${item.nama_perawi}-${item.nomor_hadits}-${idx}`}
                            item={item}
                            index={idx}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                  ) : loading ? (
                    <motion.p
                      className="text-sm text-muted-foreground dark:text-slate-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Mencari hadits...
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <SearchSettingsDialog
        open={settingsOpen}
        onOpenChange={handleOpenSettings}
        draftMode={draftMode}
        setDraftMode={setDraftMode}
        draftTopK={draftTopK}
        setDraftTopK={setDraftTopK}
        onSave={saveSettings}
        onCancel={() => handleOpenSettings(false)}
      />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SearchInterface />
    </Suspense>
  );
}
