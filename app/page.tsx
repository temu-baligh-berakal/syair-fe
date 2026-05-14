"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import LlmSummary from "@/components/LlmSummary";
import SearchResultItem from "@/components/SearchResultItem";
import SearchSettingsDialog from "@/components/SearchSettingsDialog";
import { SearchMode, SearchResponse, SearchMeta } from "@/app/types/search";
import { formatDuration, normalizeMode, normalizePage, normalizePageSize } from "@/app/lib/search-helpers";
import { Search, ChevronLeft, ChevronRight } from "lucide-react"; 

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
  const urlPage = normalizePage(searchParams.get("page"));
  const urlPageSize = normalizePageSize(searchParams.get("size"));

  const [query, setQuery] = useState(urlQuery);
  const [mode, setMode] = useState<SearchMode>(urlMode);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [draftMode, setDraftMode] = useState<SearchMode>(urlMode);
  const [draftPageSize, setDraftPageSize] = useState(urlPageSize);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const lastFetchedKeyRef = useRef<string | null>(null);

  // Gunakan SessionStorage key ini untuk mendeteksi hasil yang disimpan
  const urlSearchKey = useMemo(() => {
    return urlQuery ? `${urlQuery}::${urlMode}::${urlPage}::${urlPageSize}` : null;
  }, [urlMode, urlQuery, urlPage, urlPageSize]);

  // EFEK 1: Sinkronisasi Input Form dengan URL
  useEffect(() => {
    setQuery(urlQuery);
    setMode(urlMode);
    setPage(urlPage);
    setPageSize(urlPageSize);
  }, [urlQuery, urlMode, urlPage, urlPageSize]);

  // EFEK 2: Menjalankan Pencarian atau Memulihkan dari Sesi
  useEffect(() => {
    if (!urlSearchKey) {
      setResponse(null);
      setSearchMeta(null);
      setSummary(null); // Reset summary
      setError(null);
      lastFetchedKeyRef.current = null;
      return;
    }

    if (lastFetchedKeyRef.current === urlSearchKey) return;

    // Cek apakah hasil pencarian untuk key ini ada di sessionStorage
    const savedState = sessionStorage.getItem("lastSearchState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.key === urlSearchKey) {
          setResponse(parsed.response);
          setSearchMeta(parsed.meta);
          // 2. Pulihkan summary dari session storage
          setSummary(parsed.summary || null);
          setError(null);
          lastFetchedKeyRef.current = urlSearchKey;
          return;
        }
      } catch (e) {
        console.error("Gagal membaca session storage");
      }
    }

    setSummary(null);

    lastFetchedKeyRef.current = urlSearchKey;
    void runSearch(urlQuery, urlMode, urlPage, urlPageSize, urlSearchKey);
  }, [urlMode, urlQuery, urlSearchKey, urlPage, urlPageSize]);

  async function runSearch(searchQuery: string, searchMode: SearchMode, searchPage: number, searchPageSize: number, currentKey: string) {
    if (searchQuery.trim().length < 3) {
      setError(null);
      setResponse(null);
      setSearchMeta(null);
      toast.error("Query minimal 3 karakter.", { duration: 1000 });
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    const startedAt = performance.now();

    try {
      const result = await fetch("/api/hadits/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, page: searchPage, page_size: searchPageSize, mode: searchMode }),
      });

      const data = (await result.json()) as SearchResponse | { detail?: string };

      if (!result.ok) {
        throw new Error("detail" in data ? data.detail : "Permintaan gagal diproses.");
      }

      const meta = { durationMs: performance.now() - startedAt };
      setResponse(data as SearchResponse);
      setSearchMeta(meta);

      // SIMPAN KE SESSION STORAGE (tanpa summary dulu, akan di-update oleh onSummaryGenerated)
      sessionStorage.setItem("lastSearchState", JSON.stringify({
        key: currentKey,
        response: data,
        meta: meta,
        summary: null,
      }));

    } catch (submitError) {
      setResponse(null);
      setSearchMeta(null);
      setError(submitError instanceof Error ? submitError.message : "Terjadi kesalahan yang tidak diketahui.");
    } finally {
      setLoading(false);
    }
  }

  function navigateToSearch(nextQuery: string, nextMode: SearchMode, nextPage: number, nextPageSize: number) {
    const trimmedQuery = nextQuery.trim();
    if (trimmedQuery.length < 3) {
      setError(null);
      toast.error("Query minimal 3 karakter.", { duration: 1000 });
      return;
    }

    const params = new URLSearchParams();
    params.set("q", trimmedQuery);
    params.set("mode", nextMode);
    params.set("page", String(nextPage));
    params.set("size", String(nextPageSize));

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateToSearch(query, mode, 1, pageSize);
  }

  // FUNGSI UNTUK RESET DAN KEMBALI KE HALAMAN UTAMA (HERO)
  function handleBackToHome() {
    sessionStorage.removeItem("lastSearchState");
    setSummary(null); // Reset summary
    setQuery("");
    router.push(pathname);
  }

  function saveSettings() {
    const normalizedPageSize = Number.isNaN(draftPageSize) ? pageSize : Math.min(50, Math.max(1, draftPageSize));
    setMode(draftMode);
    setPageSize(normalizedPageSize);
    setDraftPageSize(normalizedPageSize);
    setSettingsOpen(false);
    toast.success("Pengaturan berhasil disimpan", {
      description: `Mode ${draftMode} dengan ${normalizedPageSize} item aktif.`,
      duration: 1000,
    });
    if (query) navigateToSearch(query, draftMode, 1, normalizedPageSize);
  }

  function handleOpenSettings(open: boolean) {
    if (open) {
      setDraftMode(mode);
      setDraftPageSize(pageSize);
    }
    setSettingsOpen(open);
  }

  const showResults = urlQuery.length >= 3;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-white via-sky-100/60 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-foreground dark:text-white transition-colors duration-500">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.section
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 sm:px-6 pb-24"
            >
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                <img src="/assets/logo.png" alt="Syair" className="select-none w-40 sm:w-56 h-auto" />
              </motion.div>

              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="mt-4 text-center text-sm sm:text-base text-muted-foreground dark:text-slate-400 max-w-md">
                Jelajahi koleksi Hadits dengan teknologi pencarian semantic dan AI-powered
              </motion.p>

              <motion.form onSubmit={handleSubmit} className="mt-10 sm:mt-12 w-full max-w-2xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
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
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="ml-2 flex items-center justify-center rounded-full bg-primary dark:bg-sky-500 px-6 sm:px-8 py-2.5 text-sm font-medium text-primary-foreground dark:text-white transition-all hover:bg-primary/90 dark:hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Mencari..." : "Cari"}
                  </motion.button>
                </div>
              </motion.form>

              <motion.div className="mt-8 flex flex-wrap justify-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                {exampleQueries.map((example, idx) => (
                  <motion.button key={example} type="button" onClick={() => navigateToSearch(example, mode, 1, pageSize)} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + idx * 0.08 }} className="rounded-full bg-muted dark:bg-zinc-800/50 border border-border/40 dark:border-white/10 px-4 py-2 text-xs sm:text-sm text-foreground dark:text-slate-300 transition-all hover:bg-muted/80 dark:hover:bg-zinc-700/50 hover:border-primary/20 dark:hover:border-sky-400/30">
                    {example}
                  </motion.button>
                ))}
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-8 w-full max-w-2xl rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
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
              className="w-full min-h-screen flex flex-col"
            >
              <motion.div className="sticky top-0 z-40 w-full border-b border-border/40 dark:border-white/10 bg-background/80 dark:bg-zinc-950/80 px-4 sm:px-6 py-4 backdrop-blur-md" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="max-w-5xl mx-auto flex items-center gap-3 sm:gap-4">

                  {/* TOMBOL LOGO UNTUK RESET */}
                  <motion.button type="button" onClick={handleBackToHome} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block flex-shrink-0 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label="Back to home">
                    <img src="/assets/logo.png" alt="Syair" className="h-7 sm:h-8 w-auto object-contain select-none" />
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
                        <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="ml-2 flex items-center justify-center rounded-lg bg-primary dark:bg-sky-500 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary-foreground dark:text-white transition-all hover:bg-primary/90 dark:hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed">
                          {loading ? "..." : "Cari"}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>

              <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 pb-12">
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-6 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {(loading || response) && (
                  <div className="mb-8">
                    <LlmSummary
                      query={loading ? urlQuery : response?.query || ""}
                      results={response?.results || []}
                      isSearchLoading={loading}
                      // 3. Kirim cached summary dan fungsi untuk menyimpannya
                      cachedSummary={summary}
                      onSummaryGenerated={(generated) => {
                        setSummary(generated);
                        // Update session storage dengan summary — pastikan key masih sama
                        try {
                          const raw = sessionStorage.getItem("lastSearchState");
                          if (raw) {
                            const currentState = JSON.parse(raw);
                            if (currentState.key === urlSearchKey) {
                              sessionStorage.setItem("lastSearchState", JSON.stringify({
                                ...currentState,
                                summary: generated,
                              }));
                            }
                          }
                        } catch (e) {
                          console.error("Gagal menyimpan summary ke session storage", e);
                        }
                      }}
                    />
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {response ? (
                    <motion.div key="results-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <motion.p className="mb-6 text-sm text-muted-foreground dark:text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        Sekitar <span className="font-semibold text-foreground dark:text-white">{response.total}</span> hasil ({searchMeta ? formatDuration(searchMeta.durationMs) : "0,00"} detik) untuk <span className="font-semibold text-foreground dark:text-white">&ldquo;{response.query}&rdquo;</span>
                      </motion.p>
                      {response.suggestion && response.suggestion.toLowerCase() !== response.query.toLowerCase() && (
                        <motion.p className="mb-6 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                          Mungkin maksud Anda: <button type="button" onClick={() => navigateToSearch(response.suggestion!, mode, 1, pageSize)} className="italic text-primary dark:text-sky-400 font-medium hover:underline focus:outline-none">{response.suggestion}</button>
                        </motion.p>
                      )}
                      <motion.div className="space-y-6" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
                        {response.results.map((item, idx) => (
                          <SearchResultItem key={`${item.nama_perawi}-${item.nomor_hadits}-${idx}`} item={item} index={idx} />
                        ))}
                      </motion.div>

                      {/* PAGINATION UI */}
                      {response.total > pageSize && (
                        <div className="mt-10 flex items-center justify-center gap-4">
                          <button
                            onClick={() => navigateToSearch(query, mode, Math.max(1, page - 1), pageSize)}
                            disabled={page === 1}
                            className="flex items-center gap-2 rounded-full border border-border/40 dark:border-white/10 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-4 w-4" /> Sebelumnya
                          </button>
                          <span className="text-sm font-medium text-muted-foreground">Halaman {page} dari {Math.ceil(response.total / pageSize)}</span>
                          <button
                            onClick={() => navigateToSearch(query, mode, page + 1, pageSize)}
                            disabled={page * pageSize >= response.total}
                            className="flex items-center gap-2 rounded-full border border-border/40 dark:border-white/10 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Selanjutnya <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ) : loading ? (
                    <motion.p className="text-sm text-muted-foreground dark:text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Mencari hadits...
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <SearchSettingsDialog open={settingsOpen} onOpenChange={handleOpenSettings} draftMode={draftMode} setDraftMode={setDraftMode} draftPageSize={draftPageSize} setDraftPageSize={setDraftPageSize} onSave={saveSettings} onCancel={() => handleOpenSettings(false)} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>}>
      <SearchInterface />
    </Suspense>
  );
}