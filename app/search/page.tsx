"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";

import LlmSummary from "@/components/LlmSummary";
import SearchResultItem from "@/components/SearchResultItem";
import SearchSettingsDialog from "@/components/SearchSettingsDialog";
import { SearchMode, SearchResponse, SearchMeta } from "@/app/types/search";
import { formatDuration, normalizeMode, normalizePage, normalizePageSize, normalizeNarrator } from "@/app/lib/search-helpers";

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const urlMode = normalizeMode(searchParams.get("mode"));
  const urlPage = normalizePage(searchParams.get("page"));
  const urlPageSize = normalizePageSize(searchParams.get("size"));
  const urlNarrator = normalizeNarrator(searchParams.get("perawi"));

  const [query, setQuery] = useState(urlQuery);
  const [mode, setMode] = useState<SearchMode>(urlMode);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [narrator, setNarrator] = useState(urlNarrator);
  
  const [draftMode, setDraftMode] = useState<SearchMode>(urlMode);
  const [draftPageSize, setDraftPageSize] = useState(urlPageSize);
  const [draftNarrator, setDraftNarrator] = useState(urlNarrator);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const lastFetchedKeyRef = useRef<string | null>(null);

  const urlSearchKey = useMemo(() => {
    return urlQuery ? `${urlQuery}::${urlMode}::${urlPage}::${urlPageSize}::${urlNarrator}` : null;
  }, [urlMode, urlQuery, urlPage, urlPageSize, urlNarrator]);

  // EFEK 1: Sinkronisasi form dengan URL & Auto Scroll
  useEffect(() => {
    setQuery(urlQuery);
    setMode(urlMode);
    setPage(urlPage);
    setPageSize(urlPageSize);
    setNarrator(urlNarrator);

    // Otomatis scroll ke paling atas saat pindah halaman
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [urlQuery, urlMode, urlPage, urlPageSize, urlNarrator]);

  // EFEK 2: Jalankan pencarian atau pulihkan dari sesi
  useEffect(() => {
    if (!urlSearchKey) {
      setResponse(null);
      setSearchMeta(null);
      setSummary(null);
      setError(null);
      lastFetchedKeyRef.current = null;
      return;
    }

    if (lastFetchedKeyRef.current === urlSearchKey) return;

    const savedState = sessionStorage.getItem("lastSearchState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.key === urlSearchKey) {
          setResponse(parsed.response);
          setSearchMeta(parsed.meta);
          setSummary(parsed.summary || null);
          setError(null);
          lastFetchedKeyRef.current = urlSearchKey;
          return;
        }
      } catch {
        console.error("Gagal membaca session storage");
      }
    }

    // PENTING: Jangan hapus summary jika hanya pindah page dalam kueri yang sama
    lastFetchedKeyRef.current = urlSearchKey;
    void runSearch(urlQuery, urlMode, urlPage, urlPageSize, urlNarrator, urlSearchKey);
  }, [urlMode, urlQuery, urlSearchKey, urlPage, urlPageSize, urlNarrator]);

  async function runSearch(
    searchQuery: string,
    searchMode: SearchMode,
    searchPage: number,
    searchPageSize: number,
    searchNarrator: string,
    currentKey: string
  ) {
    if (searchQuery.trim().length < 3) {
      toast.error("Query minimal 3 karakter.", { duration: 1000 });
      return;
    }

    // Logika untuk mempertahankan summary yang sudah ada dari kueri yang sama
    let preservedSummary = null;
    try {
      const raw = sessionStorage.getItem("lastSearchState");
      if (raw) {
        const parsed = JSON.parse(raw);
        const parts = parsed.key.split("::");
        // Jika Query, Mode, dan Perawi sama, ambil summary lamanya
        if (parts[0] === searchQuery && parts[1] === searchMode && (parts[4] || "") === (searchNarrator || "")) {
          preservedSummary = parsed.summary;
        }
      }
    } catch (e) {}

    setLoading(true);
    setError(null);
    
    // Reset summary hanya jika tidak ada summary lama yang bisa dipertahankan
    if (!preservedSummary) setSummary(null);
    else setSummary(preservedSummary);

    const startedAt = performance.now();

    try {
      const result = await fetch("/api/hadits/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          page: searchPage,
          page_size: searchPageSize,
          nama_perawi: searchNarrator || undefined,
          mode: searchMode,
          threshold: 0,
        }),
      });

      const data = (await result.json()) as SearchResponse | { detail?: string };

      if (!result.ok) throw new Error("Gagal memproses data.");

      const meta = { durationMs: performance.now() - startedAt };
      setResponse(data as SearchResponse);
      setSearchMeta(meta);

      // Simpan state dengan menyertakan summary yang sudah ada
      sessionStorage.setItem(
        "lastSearchState",
        JSON.stringify({ 
          key: currentKey, 
          response: data, 
          meta, 
          summary: preservedSummary 
        })
      );
    } catch (submitError) {
      setResponse(null);
      setSearchMeta(null);
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function navigateToSearch(
    nextQuery: string,
    nextMode: SearchMode,
    nextPage: number,
    nextPageSize: number,
    nextNarrator: string
  ) {
    const trimmed = nextQuery.trim();
    if (trimmed.length < 3) {
      toast.error("Query minimal 3 karakter.", { duration: 1000 });
      return;
    }
    const params = new URLSearchParams();
    params.set("q", trimmed);
    params.set("mode", nextMode);
    params.set("page", String(nextPage));
    params.set("size", String(nextPageSize));
    if (nextNarrator) {
      params.set("perawi", nextNarrator);
    }
    router.push(`/search?${params.toString()}`);
  }

  // Sisa fungsi sama persis...
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigateToSearch(query, mode, 1, pageSize, narrator);
  }

  function handleBackToHome() {
    sessionStorage.removeItem("lastSearchState");
    router.push("/");
  }

  function saveSettings() {
    const normalizedPageSize = Number.isNaN(draftPageSize)
      ? pageSize
      : Math.min(50, Math.max(1, draftPageSize));
    setMode(draftMode);
    setPageSize(normalizedPageSize);
    setNarrator(draftNarrator);
    setDraftPageSize(normalizedPageSize);
    setSettingsOpen(false);
    toast.success("Pengaturan berhasil disimpan", {
      description: `Mode ${draftMode} dengan ${normalizedPageSize} item aktif.`,
      duration: 1000,
    });
    if (query) navigateToSearch(query, draftMode, 1, normalizedPageSize, draftNarrator);
  }

  function handleOpenSettings(open: boolean) {
    if (open) {
      setDraftMode(mode);
      setDraftPageSize(pageSize);
      setDraftNarrator(narrator);
    }
    setSettingsOpen(open);
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-white via-sky-100/60 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-foreground dark:text-white transition-colors duration-500 flex flex-col">
        {/* Sticky top bar */}
        <motion.div
          className="sticky top-0 z-40 w-full border-b border-border/40 dark:border-white/10 bg-background/80 dark:bg-zinc-950/80 px-4 sm:px-6 py-4 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-3 sm:gap-4">
            <motion.button
              type="button"
              onClick={handleBackToHome}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:block flex-shrink-0 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Back to home"
            >
              <img
                src="/assets/logo.png"
                alt="Syair"
                className="h-7 sm:h-8 w-auto object-contain select-none"
              />
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
                  <AnimatePresence>
                    {query && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setQuery("")}
                        className="p-1 rounded-full text-muted-foreground hover:text-foreground dark:hover:text-slate-300 transition-colors focus:outline-none"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
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

        {/* Results body */}
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 pb-12">
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

          {/* FIX: LlmSummary tetap hanya dirender di page === 1 */}
          {page === 1 && (loading || response) && (
            <div className="mb-8">
              <LlmSummary
                query={loading ? urlQuery : response?.query || ""}
                results={response?.results || []}
                isSearchLoading={loading}
                cachedSummary={summary}
                // HAPUS BARIS INI -> page={page}
                onSummaryGenerated={(generated) => {
                  setSummary(generated);
                  try {
                    const raw = sessionStorage.getItem("lastSearchState");
                    if (raw) {
                      const currentState = JSON.parse(raw);
                      sessionStorage.setItem(
                        "lastSearchState",
                        JSON.stringify({ ...currentState, summary: generated })
                      );
                    }
                  } catch (e) {}
                }}
              />
            </div>
          )}

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
                  className="mb-6 text-sm text-muted-foreground dark:text-slate-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Sekitar{" "}
                  <span className="font-semibold text-foreground dark:text-white">
                    {response.total}
                  </span>{" "}
                  hasil ({searchMeta ? formatDuration(searchMeta.durationMs) : "0,00"} detik) untuk{" "}
                  <span className="font-semibold text-foreground dark:text-white">
                    &ldquo;{response.query}&rdquo;
                  </span>
                </motion.p>

                {response.suggestion &&
                  response.suggestion.toLowerCase() !== response.query.toLowerCase() && (
                    <motion.p
                      className="mb-6 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Mungkin maksud Anda:{" "}
                      <button
                        type="button"
                        onClick={() =>
                          navigateToSearch(response.suggestion!, mode, 1, pageSize, narrator)
                        }
                        className="italic text-primary dark:text-sky-400 font-medium hover:underline focus:outline-none"
                      >
                        {response.suggestion}
                      </button>
                    </motion.p>
                  )}

                <motion.div
                  className="space-y-6"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
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

                {response.total > pageSize && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => navigateToSearch(query, mode, Math.max(1, page - 1), pageSize, narrator)}
                      disabled={page === 1}
                      className="flex items-center gap-1 rounded-full border border-border/40 dark:border-white/10 bg-card pl-2 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors hover:bg-muted dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </button>

                    {(() => {
                      const totalPages = Math.ceil(response.total / pageSize);
                      const maxVisiblePages = 5;
                      let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      const pages = Array.from(
                        { length: endPage - startPage + 1 },
                        (_, i) => startPage + i
                      );

                      return (
                        <div className="flex items-center gap-1">
                          {startPage > 1 && (
                            <>
                              <button
                                onClick={() => navigateToSearch(query, mode, 1, pageSize, narrator)}
                                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border/40 dark:border-white/10 bg-card text-xs sm:text-sm font-medium hover:bg-muted dark:hover:bg-zinc-800 transition-colors"
                              >
                                1
                              </button>
                              {startPage > 2 && <span className="px-1 text-muted-foreground">...</span>}
                            </>
                          )}
                          
                          {pages.map((p) => (
                            <button
                              key={p}
                              onClick={() => navigateToSearch(query, mode, p, pageSize, narrator)}
                              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border text-xs sm:text-sm font-medium transition-colors ${
                                page === p
                                  ? "border-primary bg-primary text-primary-foreground dark:border-sky-500 dark:bg-sky-500 dark:text-white"
                                  : "border-border/40 dark:border-white/10 bg-card hover:bg-muted dark:hover:bg-zinc-800"
                              }`}
                            >
                              {p}
                            </button>
                          ))}

                          {endPage < totalPages && (
                            <>
                              {endPage < totalPages - 1 && <span className="px-1 text-muted-foreground">...</span>}
                              <button
                                onClick={() => navigateToSearch(query, mode, totalPages, pageSize, narrator)}
                                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border/40 dark:border-white/10 bg-card text-xs sm:text-sm font-medium hover:bg-muted dark:hover:bg-zinc-800 transition-colors"
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => navigateToSearch(query, mode, page + 1, pageSize, narrator)}
                      disabled={page * pageSize >= response.total}
                      className="flex items-center gap-1 rounded-full border border-border/40 dark:border-white/10 bg-card pl-3 pr-2 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors hover:bg-muted dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
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
        </div>
      </main>

      <SearchSettingsDialog
        open={settingsOpen}
        onOpenChange={handleOpenSettings}
        draftMode={draftMode}
        setDraftMode={setDraftMode}
        draftPageSize={draftPageSize}
        setDraftPageSize={setDraftPageSize}
        draftNarrator={draftNarrator}
        setDraftNarrator={setDraftNarrator}
        onSave={saveSettings}
        onCancel={() => handleOpenSettings(false)}
      />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}