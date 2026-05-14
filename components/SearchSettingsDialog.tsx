"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { SearchMode } from "@/app/types/search";
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

interface SearchSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftMode: SearchMode;
  setDraftMode: (mode: SearchMode) => void;
  draftPageSize: number;
  setDraftPageSize: (pageSize: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

type Theme = "light" | "dark" | "system";

export default function SearchSettingsDialog({
  open,
  onOpenChange,
  draftMode,
  setDraftMode,
  draftPageSize,
  setDraftPageSize,
  onSave,
  onCancel,
}: SearchSettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  
  // State draft khusus untuk tema
  const [draftTheme, setDraftTheme] = useState<Theme>(theme);

  // Sync draftTheme dengan actual theme saat dialog dibuka
  useEffect(() => {
    if (open) {
      setDraftTheme(theme);
    }
  }, [open, theme]);

  // Handle logika tombol "Simpan"
  const handleSave = () => {
    setTheme(draftTheme); // Set tema sesungguhnya di sini
    onSave();             // Lanjutkan proses save parameter pencarian
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Buka pengaturan pencarian"
        onClick={() => onOpenChange(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary dark:bg-sky-500 text-primary-foreground dark:text-white shadow-lg dark:shadow-sky-500/20 transition-all duration-300 hover:shadow-xl dark:hover:shadow-lg dark:hover:shadow-sky-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Settings className="h-5 w-5" />
      </motion.button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-border/40 dark:border-white/10 bg-card dark:bg-zinc-900/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="text-foreground dark:text-white">
              Pengaturan Pencarian
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-slate-400">
              Atur mode pencarian dan jumlah hasil yang dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <motion.div
            className="mt-6 space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Theme Setting */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-foreground dark:text-white">
                Tema
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "system"] as const).map((themeOption) => (
                  <motion.button
                    key={themeOption}
                    type="button"
                    onClick={() => setDraftTheme(themeOption)} // Ubah draft, bukan actual theme
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 transition-all ${
                      draftTheme === themeOption
                        ? "border-primary dark:border-sky-400 bg-primary/10 dark:bg-sky-500/10"
                        : "border-border/40 dark:border-white/10 hover:border-primary/50 dark:hover:border-sky-400/50"
                    }`}
                  >
                    {themeOption === "light" && (
                      <Sun className={`h-5 w-5 ${draftTheme === themeOption ? "text-primary dark:text-sky-400" : "text-muted-foreground dark:text-slate-500"}`} />
                    )}
                    {themeOption === "dark" && (
                      <Moon className={`h-5 w-5 ${draftTheme === themeOption ? "text-primary dark:text-sky-400" : "text-muted-foreground dark:text-slate-500"}`} />
                    )}
                    {themeOption === "system" && (
                      <Monitor className={`h-5 w-5 ${draftTheme === themeOption ? "text-primary dark:text-sky-400" : "text-muted-foreground dark:text-slate-500"}`} />
                    )}
                    <span className={`text-xs font-medium capitalize ${draftTheme === themeOption ? "text-primary dark:text-sky-400" : "text-muted-foreground dark:text-slate-500"}`}>
                      {themeOption === "light" ? "Terang" : themeOption === "dark" ? "Gelap" : "Sistem"}
                    </span>
                  </motion.button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground dark:text-slate-500">
                Pilih tema yang Anda inginkan untuk antarmuka aplikasi.
              </p>
            </div>

            {/* Search Mode */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-foreground dark:text-white">
                Mode Pencarian
              </label>
              <Select
                value={draftMode}
                onValueChange={(value) => setDraftMode(value as SearchMode)}
              >
                <SelectTrigger className="rounded-lg border-border/40 dark:border-white/10 bg-muted dark:bg-zinc-800 text-foreground dark:text-white hover:border-primary/40 dark:hover:border-sky-400/40 focus:ring-primary/50 dark:focus:ring-sky-400/50">
                  <SelectValue placeholder="Pilih mode pencarian" />
                </SelectTrigger>
                <SelectContent className="border-border/40 dark:border-white/10 bg-card dark:bg-zinc-900 backdrop-blur">
                  <SelectItem value="hybrid" className="dark:focus:bg-zinc-800">
                    Hybrid Search
                  </SelectItem>
                  <SelectItem value="knn" className="dark:focus:bg-zinc-800">
                    Semantic KNN
                  </SelectItem>
                  <SelectItem value="bm25" className="dark:focus:bg-zinc-800">
                    Keyword BM25
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground dark:text-slate-500">
                Pilih strategi pencarian yang paling sesuai untuk kebutuhan Anda.
              </p>
            </div>

            {/* Top K Setting */}
            <div>
              <label
                htmlFor="top-k"
                className="mb-3 block text-sm font-semibold text-foreground dark:text-white"
              >
                Hasil per Halaman
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="top-k"
                  type="range"
                  min={1}
                  max={50}
                  value={draftPageSize}
                  onChange={(event) => setDraftPageSize(Number(event.target.value))}
                  className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-gray-400 dark:accent-gray-500"
                />
                <motion.div
                  key={draftPageSize}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="min-w-12 rounded-lg bg-primary/10 dark:bg-sky-500/10 px-3 py-2 text-center text-sm font-semibold text-primary dark:text-sky-400"
                >
                  {draftPageSize}
                </motion.div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground dark:text-slate-500">
                Menampilkan 1 sampai 50 hasil per halaman.
              </p>
            </div>
          </motion.div>

          <DialogFooter className="mt-8 gap-3 sm:gap-0">
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-muted dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-foreground dark:text-white transition-colors hover:bg-muted/80 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Batal
            </motion.button>
            <motion.button
              type="button"
              onClick={handleSave} // Diubah untuk menggunakan function handleSave
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-primary dark:bg-sky-500 px-4 py-2.5 text-sm font-medium text-primary-foreground dark:text-white transition-colors hover:bg-primary/90 dark:hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Simpan
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}