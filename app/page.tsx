"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { SearchMode } from "@/app/types/search";
import { normalizeMode, normalizePageSize } from "@/app/lib/search-helpers";

const exampleQueries = [
  "shalat berjamaah lebih utama",
  "larangan marah",
  "keutamaan menuntut ilmu",
];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode] = useState<SearchMode>(normalizeMode(null));
  const [pageSize] = useState(normalizePageSize(null));

  function navigateToSearch(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 3) {
      toast.error("Query minimal 3 karakter.", { duration: 1000 });
      return;
    }
    const params = new URLSearchParams();
    params.set("q", trimmed);
    params.set("mode", mode);
    params.set("page", "1");
    params.set("size", String(pageSize));
    router.push(`/search?${params.toString()}`);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigateToSearch(query);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-sky-100/60 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-foreground dark:text-white transition-colors duration-500">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 sm:px-6 pb-24"
      >
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

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-4 text-center text-sm sm:text-base text-muted-foreground dark:text-slate-400 max-w-md"
        >
          Jelajahi koleksi Hadits dengan teknologi pencarian semantic dan AI-powered
        </motion.p>

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
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-2 flex items-center justify-center rounded-full bg-primary dark:bg-sky-500 px-6 sm:px-8 py-2.5 text-sm font-medium text-primary-foreground dark:text-white transition-all hover:bg-primary/90 dark:hover:bg-sky-600"
            >
              Cari
            </motion.button>
          </div>
        </motion.form>

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
              onClick={() => navigateToSearch(example)}
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
      </motion.section>
    </main>
  );
}