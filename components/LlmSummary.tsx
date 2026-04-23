"use client";

import { useEffect, useState } from "react";

// Tipe data disamakan dengan hasil dari search OpenSearch
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
}: {
  query: string;
  results: SearchResult[];
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Jika tidak ada query atau hasil kosong, tidak perlu request ke LLM
    if (!query || !results || results.length === 0) return;

    // Menggunakan AbortController untuk membatalkan request lama jika user mengetik query baru cepat-cepat
    const abortController = new AbortController();

    async function fetchSummary() {
      setLoading(true);
      setError(null);
      
      try {
        // AMBIL TOP 3 RESULT SAJA
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
        
        // Membersihkan string jika LLM mengembalikan format JSON string
        let text = data.summary;
        try {
          const parsed = JSON.parse(text);
          if (parsed.summary) text = parsed.summary;
        } catch (e) {
          // Abaikan jika text memang murni string biasa
        }

        setSummary(text);
      } catch (err: any) {
        if (err.name === "AbortError") return; // Abaikan error dari request yang dibatalkan
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();

    return () => {
      abortController.abort();
    };
  }, [query, results]); // Akan dipanggil ulang setiap kali hasil pencarian berubah

  if (!loading && !summary && !error) return null;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-[#dadce0] bg-linear-to-br from-[#f8f9fa] to-[#e8eaed] p-px shadow-sm">
      <div className="rounded-[15px] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          {/* Ikon Sparkle khas AI */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a73e8]">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
          </svg>
          <h3 className="text-[16px] font-medium text-[#202124]">Ringkasan AI</h3>
        </div>

        {/* EFEK SHIMMER (SKELETON) */}
        {loading ? (
          <div className="space-y-3 py-2">
            <div className="h-4 w-full animate-pulse rounded-md bg-[#e8eaed]"></div>
            <div className="h-4 w-[90%] animate-pulse rounded-md bg-[#e8eaed]"></div>
            <div className="h-4 w-[75%] animate-pulse rounded-md bg-[#e8eaed]"></div>
          </div>
        ) : error ? (
          <p className="text-sm text-[#c5221f]">{error}</p>
        ) : (
          <div className="text-[15px] leading-7 text-[#3c4043]">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}