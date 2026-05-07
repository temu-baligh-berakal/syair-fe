"use client";

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

type SearchResult = {
  nama_perawi: string;
  nomor_hadits: number;
  referensi_lengkap: string;
  arab: string;
  terjemahan: string;
  score: number;
};

export default function LlmSummary({
  query,
  results,
  isSearchLoading = false, // TAMBAHAN PROPS BARU
}: {
  query: string;
  results: SearchResult[];
  isSearchLoading?: boolean;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Jika aplikasi sedang fetch ke OpenSearch, paksa mode Shimmer
    if (isSearchLoading) {
      setLoading(true);
      setError(null);
      setSummary(null);
      setDisplayedText("");
      setIsTyping(false);
      setIsExpanded(false);
      return;
    }

    // 2. Jika fetch OpenSearch selesai tapi hasil kosong, hilangkan Shimmer
    if (!query || !results || results.length === 0) {
      setLoading(false);
      return;
    }

    // 3. Jika OpenSearch berhasil menemukan hasil, mulai fetch ke LLM
    const abortController = new AbortController();

    async function fetchSummary() {
      setLoading(true);
      setError(null);
      
      try {
        const top3 = results.slice(0, 3).map((item) => ({
          nama_perawi: item.nama_perawi,
          nomor_hadits: item.nomor_hadits,
          referensi_lengkap: item.referensi_lengkap,
          terjemahan: item.terjemahan,
        }));

        const res = await fetch("/api/llm/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, hadits_results: top3 }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || "Gagal mendapatkan ringkasan AI.");
        }

        const data = await res.json();
        let text = data.summary;
        
        try {
          const parsed = JSON.parse(text);
          if (parsed.summary) text = parsed.summary;
        } catch (e) {}

        text = text.replace(/\\n/g, '\n');
        setSummary(text);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();

    return () => {
      abortController.abort();
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [query, results, isSearchLoading]); // Tambahkan isSearchLoading sebagai dependency

  // Logika Animasi Mengetik
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

  // Sembunyikan component HANYA jika sedang tidak ada proses sama sekali
  if (!isSearchLoading && !loading && !summary && !error && !isTyping) return null;

  // Gabungan status loading (OpenSearch loading ATAU LLM loading)
  const showShimmer = isSearchLoading || loading;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-[#dadce0] bg-gradient-to-br from-[#f8f9fa] to-[#e8eaed] p-[1px] shadow-sm transition-all duration-500 ease-in-out">
      <div className="rounded-[15px] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a73e8]">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
          </svg>
          <h3 className="text-[16px] font-medium text-[#202124]">Ringkasan AI</h3>
        </div>

        <div className="transition-all duration-500 ease-in-out">
          {showShimmer ? (
            <div className="space-y-3 py-2">
              <div className="h-4 w-full animate-pulse rounded-md bg-[#e8eaed]"></div>
              <div className="h-4 w-[90%] animate-pulse rounded-md bg-[#e8eaed]"></div>
              <div className="h-4 w-[75%] animate-pulse rounded-md bg-[#e8eaed]"></div>
            </div>
          ) : error ? (
            <p className="text-sm text-[#c5221f]">{error}</p>
          ) : (
            <div>
              <div 
                className={`text-[15px] leading-7 text-[#3c4043] transition-all duration-300 ${
                  !isExpanded ? "line-clamp-6" : ""
                }`}
              >
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    h3: ({node, ...props}) => <h3 className="mt-4 mb-2 text-[17px] font-semibold text-[#202124]" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-[#202124]" {...props} />,
                    ul: ({node, ...props}) => <ul className="mb-2 ml-5 list-disc" {...props} />,
                    ol: ({node, ...props}) => <ol className="mb-2 ml-5 list-decimal" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />
                  }}
                >
                  {displayedText}
                </ReactMarkdown>
              </div>
              
              {summary && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 font-medium text-[#1a73e8] hover:underline focus:outline-none"
                >
                  {isExpanded ? "Lebih Sedikit" : "Baca Selengkapnya"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}