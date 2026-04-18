"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchMode = "knn" | "bm25" | "hybrid";

type SearchResult = {
  nama_perawi: string;
  nomor_hadits: number;
  referensi_lengkap: string;
  arab: string;
  terjemahan: string;
  score: number;
};

type SearchResponse = {
  query: string;
  total: number;
  results: SearchResult[];
};

type SearchMeta = {
  durationMs: number;
};

const exampleQueries = [
  "shalat berjamaah lebih utama",
  "larangan marah",
  "keutamaan menuntut ilmu",
];

function formatDuration(durationMs: number) {
  return (durationMs / 1000).toFixed(2).replace(".", ",");
}

function normalizeMode(value: string | null): SearchMode {
  if (value === "knn" || value === "bm25" || value === "hybrid") {
    return value;
  }

  return "hybrid";
}

function normalizeTopK(value: string | null): number {
  if (value === null || value.trim() === "") {
    return 10;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 10;
  }

  return Math.min(50, Math.max(1, parsed));
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35A1.724 1.724 0 0 0 5.382 7.753c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.573-1.066Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ModeSelect({
  mode,
  onChange,
}: {
  mode: SearchMode;
  onChange: (value: SearchMode) => void;
}) {
  return (
    <Select value={mode} onValueChange={(value) => onChange(value as SearchMode)}>
      <SelectTrigger>
        <SelectValue placeholder="Pilih mode search" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="hybrid">Hybrid Search</SelectItem>
        <SelectItem value="knn">Semantic KNN</SelectItem>
        <SelectItem value="bm25">Keyword BM25</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function Home() {
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
    if (!urlQuery) {
      return null;
    }

    return `${urlQuery}::${urlMode}::${urlTopK}`;
  }, [urlMode, urlQuery, urlTopK]);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setMode(urlMode);
    setTopK(urlTopK);
  }, [urlMode, urlTopK]);

  async function runSearch(searchQuery: string, searchMode: SearchMode, searchTopK: number) {
    if (searchQuery.trim().length < 3) {
      setError(null);
      setResponse(null);
      setSearchMeta(null);
      toast.error("Query minimal 3 karakter.", {
        duration: 1000,
      });
      return;
    }

    setLoading(true);
    setError(null);

    const startedAt = performance.now();

    try {
      const result = await fetch("/api/hadits/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          top_k: searchTopK,
          mode: searchMode,
        }),
      });

      const data = (await result.json()) as SearchResponse | { detail?: string };

      if (!result.ok) {
        const message = "detail" in data ? data.detail : undefined;
        throw new Error(message || "Permintaan gagal diproses.");
      }

      setResponse(data as SearchResponse);
      setSearchMeta({ durationMs: performance.now() - startedAt });
    } catch (submitError) {
      setResponse(null);
      setSearchMeta(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Terjadi kesalahan yang tidak diketahui.",
      );
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

    if (lastFetchedKeyRef.current === urlSearchKey) {
      return;
    }

    lastFetchedKeyRef.current = urlSearchKey;
    void runSearch(urlQuery, urlMode, urlTopK);
  }, [urlMode, urlQuery, urlSearchKey, urlTopK]);

  function navigateToSearch(nextQuery: string, nextMode: SearchMode, nextTopK: number) {
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery.length < 3) {
      setError(null);
      toast.error("Query minimal 3 karakter.", {
        duration: 1000,
      });
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

  function openSettings() {
    setDraftMode(mode);
    setDraftTopK(topK);
    setSettingsOpen(true);
  }

  function closeSettings() {
    setDraftMode(mode);
    setDraftTopK(topK);
    setSettingsOpen(false);
  }

  function saveSettings() {
    const normalizedTopK = Number.isNaN(draftTopK)
      ? topK
      : Math.min(50, Math.max(1, draftTopK));

    setMode(draftMode);
    setTopK(normalizedTopK);
    setDraftTopK(normalizedTopK);
    setSettingsOpen(false);
    toast.success("Pengaturan berhasil disimpan", {
      description: `Mode ${draftMode} dengan ${normalizedTopK} item aktif.`,
      duration: 1000,
    });
  }

  const showResults = urlQuery.length >= 3;

  return (
    <>
      <main className="min-h-screen bg-white text-[#202124]">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-6">
          {!showResults ? (
            <section className="flex flex-1 flex-col items-center justify-center pb-24">
              <h1 className="select-none text-7xl font-medium tracking-tight text-black sm:text-8xl">
                Syair
              </h1>

              <form onSubmit={handleSubmit} className="mt-8 w-full max-w-3xl">
                <div className="rounded-2xl border border-[#dfe1e5] px-5 py-3 shadow-sm hover:shadow-md focus-within:shadow-md">
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari hadits..."
                    className="w-full border-0 bg-transparent text-base outline-none"
                  />
                </div>

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="rounded bg-[#f8f9fa] px-4 py-2 text-sm text-[#3c4043] hover:border-[#dadce0] hover:shadow-sm disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Mencari..." : "Search"}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {exampleQueries.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setQuery(example)}
                    className="rounded-full bg-[#f1f3f4] px-3 py-1.5 text-xs text-[#3c4043] hover:bg-[#e8eaed]"
                  >
                    {example}
                  </button>
                ))}
              </div>

              {error ? (
                <div className="mt-8 w-full max-w-3xl rounded border border-[#f1c6c5] bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f]">
                  {error}
                </div>
              ) : null}
            </section>
          ) : (
            <section>
              <div className="flex items-start gap-4 border-b border-[#ebebeb] pb-6 pt-2">
                <button
                  type="button"
                  onClick={() => router.push(pathname)}
                  className="select-none pt-2 text-3xl font-medium tracking-tight text-black"
                >
                  Syair
                </button>

                <div className="w-full max-w-3xl">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-2xl border border-[#dfe1e5] px-5 py-3 shadow-sm hover:shadow-md focus-within:shadow-md">
                      <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari hadits..."
                        className="w-full border-0 bg-transparent text-base outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-[#5f6368]">
                      <button
                        type="submit"
                        className="rounded bg-[#f8f9fa] px-4 py-2 text-[#3c4043] hover:shadow-sm"
                        disabled={loading}
                      >
                        {loading ? "Mencari..." : "Search"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="ml-0 mt-6 max-w-3xl md:ml-24">
                {error ? (
                  <div className="mb-6 rounded border border-[#f1c6c5] bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f]">
                    {error}
                  </div>
                ) : null}

                {response ? (
                  <>
                    <p className="mb-6 text-sm text-[#70757a]">
                      Sekitar {response.total} hasil ({searchMeta ? formatDuration(searchMeta.durationMs) : "0,00"} detik) untuk &ldquo;{response.query}&rdquo;
                    </p>

                    <div className="space-y-8">
                      {response.results.map((item, index) => (
                        <article key={`${item.nama_perawi}-${item.nomor_hadits}-${index}`}>
                          <p className="text-sm text-[#202124]">{item.nama_perawi}</p>
                          <h2 className="mt-1 text-[22px] font-normal leading-7 text-[#1a0dab] hover:underline">
                            {item.referensi_lengkap}
                          </h2>
                          <p className="mt-1 text-sm text-[#4d5156]">
                            Nomor hadits {item.nomor_hadits} - score {item.score.toFixed(4)}
                          </p>
                          <p className="mt-4 text-right text-2xl leading-10 text-[#202124]" dir="rtl">
                            {item.arab}
                          </p>
                          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#4d5156]">
                            {item.terjemahan}
                          </p>
                        </article>
                      ))}
                    </div>
                  </>
                ) : loading ? (
                  <p className="text-sm text-[#70757a]">Mencari...</p>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </main>

      <button
        type="button"
        aria-label="Buka pengaturan pencarian"
        onClick={openSettings}
        className="fixed bottom-6 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
      >
        <SettingsIcon />
      </button>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan pencarian</DialogTitle>
            <DialogDescription>
              Atur mode pencarian dan jumlah hasil yang dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mode search
              </label>
              <ModeSelect mode={draftMode} onChange={setDraftMode} />
            </div>

            <div>
              <label htmlFor="top-k" className="mb-2 block text-sm font-medium text-slate-700">
                Jumlah item
              </label>
              <input
                id="top-k"
                type="number"
                min={1}
                max={50}
                value={draftTopK}
                onChange={(event) => setDraftTopK(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs text-slate-500">Nilai yang didukung backend: 1 sampai 50.</p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={closeSettings}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={saveSettings}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
