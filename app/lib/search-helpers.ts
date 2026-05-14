import { SearchMode } from "@/app/types/search";

export function formatDuration(durationMs: number) {
  return (durationMs / 1000).toFixed(2).replace(".", ",");
}

export function normalizeMode(value: string | null): SearchMode {
  if (value === "knn" || value === "bm25" || value === "hybrid") {
    return value;
  }
  return "hybrid";
}

export function normalizePageSize(value: string | null): number {
  if (value === null || value.trim() === "") {
    return 10;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 10;
  }
  return Math.min(50, Math.max(1, parsed));
}

export function normalizePage(value: string | null): number {
  if (value === null || value.trim() === "") {
    return 1;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function normalizeNarrator(value: string | null): string {
  return value?.trim() ?? "";
}
