import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SearchResult } from "@/app/types/search";

export default function SearchResultItem({
  item,
  index = 0,
}: {
  item: SearchResult;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.01 }}
      className="group rounded-xl border border-border/40 dark:border-white/10 bg-card dark:bg-zinc-900/30 p-5 sm:p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 dark:hover:border-sky-400/30 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"
    >
      {/* Header Info */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-400">
          {item.nama_perawi}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 dark:bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-primary dark:text-sky-400">
          {(item.score * 100).toFixed(1)}%
        </span>
      </div>

      {/* Title */}
      <motion.h2
        className="mt-2 text-lg sm:text-xl font-semibold leading-snug text-foreground dark:text-white transition-colors duration-300 group-hover:text-primary dark:group-hover:text-sky-400"
        whileHover={{ x: 4 }}
      >
        {item.referensi_lengkap}
      </motion.h2>

      {/* Hadith Reference */}
      <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground dark:text-slate-500">
        Hadits No. {item.nomor_hadits}
      </p>

      {/* Arabic Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-5 rounded-lg bg-muted dark:bg-black/30 p-4 sm:p-5 border border-border/60 dark:border-white/5"
      >
        <p
          className="text-right text-lg sm:text-xl leading-relaxed text-foreground dark:text-white font-medium"
          dir="rtl"
        >
          {item.arab}
        </p>
      </motion.div>

      {/* Preview Snippet with Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5"
      >
        <div className="text-sm sm:text-base leading-relaxed text-foreground/80 dark:text-slate-300">
          <ReactMarkdown
            components={{
              // Menangkap tag <strong> dari markdown **bold** dan memberinya warna biru/sky
              strong: ({ node, ...props }) => (
                <span className="font-semibold text-primary dark:text-sky-400" {...props} />
              ),
            }}
          >
            {/* Fallback ke terjemahan utuh jika preview kosong */}
            {item.preview || item.terjemahan}
          </ReactMarkdown>
        </div>
      </motion.div>
    </motion.article>
  );
}