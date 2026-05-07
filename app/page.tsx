"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import LlmSummary from "@/components/LlmSummary";
import SearchResultItem from "@/components/SearchResultItem";
import SearchSettingsDialog from "@/components/SearchSettingsDialog";
import { SearchMode, SearchResponse, SearchMeta } from "@/app/types/search";
import { formatDuration, normalizeMode, normalizeTopK } from "@/app/lib/search-helpers";
import { Search } from "lucide-react";

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
      <main className="min-h-screen bg-white text-[#202124]">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-6">

          {!showResults ? (
            <section className="flex flex-1 flex-col items-center justify-center pb-24">
              <img src="/assets/logo.png" alt="Syair" className="select-none w-[420px] max-w-full" />

              <form onSubmit={handleSubmit} className="mt-8 w-full max-w-3xl">
                {/* Search Bar Wrapper */}

                <div className="flex w-full items-center rounded-full border border-[#dfe1e5] bg-white py-2 pl-6 pr-2 shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
                  <Search className="h-5 w-5 text-[#9aa0a6] mr-2" />

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari hadits..."
                    className="flex-1 border-0 bg-transparent text-base outline-none"
                  />
                  {/* Tombol Search di dalam input */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 flex items-center justify-center rounded-full bg-blue-100 px-6 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 disabled:opacity-60"
                  >
                    {loading ? "Mencari..." : "Search"}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {exampleQueries.map((example) => (
                  <button key={example} type="button" onClick={() => setQuery(example)} className="rounded-full bg-[#f1f3f4] px-3 py-1.5 text-xs text-[#3c4043] hover:bg-[#e8eaed]">
                    {example}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-8 w-full max-w-3xl rounded border border-[#f1c6c5] bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f]">
                  {error}
                </div>
              )}
            </section>
          ) : (

            <section>
              <div className="flex items-start gap-4 border-b border-[#ebebeb] pb-6 pt-2">
                <button type="button" onClick={() => router.push(pathname)} className="select-none pt-2">
                  <img src="/assets/logo.png" alt="Syair" className="h-8 max-h-full" />
                </button>

                <div className="w-full max-w-3xl">
                  <form onSubmit={handleSubmit} className="w-full">
                    {/* Search Bar Wrapper */}
                    <div className="flex w-full items-center rounded-full border border-[#dfe1e5] bg-white py-1.5 pl-6 pr-2 shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
                      {/* Ikon Search di Kiri */}
                      <Search className="h-5 w-5 text-[#9aa0a6] mr-2" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari hadits..."
                        className="flex-1 border-0 bg-transparent text-base outline-none"
                      />
                      {/* Tombol Search di dalam input */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="ml-3 flex items-center justify-center rounded-full bg-blue-100 px-5 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 disabled:opacity-60"
                      >
                        {loading ? "Mencari..." : "Search"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="ml-0 mt-6 max-w-3xl md:ml-24">
                {error && (
                  <div className="mb-6 rounded border border-[#f1c6c5] bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f]">
                    {error}
                  </div>
                )}

                {(loading || response) && (
                  <LlmSummary
                    query={loading ? urlQuery : response?.query || ""}
                    results={response?.results || []}
                    isSearchLoading={loading}
                  />
                )}

                {response ? (
                  <>
                    <p className="mb-6 text-sm text-[#70757a]">
                      Sekitar {response.total} hasil ({searchMeta ? formatDuration(searchMeta.durationMs) : "0,00"} detik) untuk &ldquo;{response.query}&rdquo;
                    </p>

                    <div className="space-y-8">
                      {response.results.map((item, index) => (
                        <SearchResultItem key={`${item.nama_perawi}-${item.nomor_hadits}-${index}`} item={item} />
                      ))}
                    </div>
                  </>
                ) : loading ? (
                  <p className="mb-6 text-sm text-[#70757a]">Mencari hadits...</p>
                ) : null}
              </div>
            </section>
          )}
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