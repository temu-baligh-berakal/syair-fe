export type SearchMode = "knn" | "bm25" | "hybrid";

export type SearchResult = {
  nama_perawi: string;
  nomor_hadits: number;
  referensi_lengkap: string;
  arab: string;
  terjemahan: string;
  score: number;
};

export type SearchResponse = {
  query: string;
  total: number;
  results: SearchResult[];
};

export type SearchMeta = {
  durationMs: number;
};