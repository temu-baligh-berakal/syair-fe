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

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35A1.724 1.724 0 0 0 5.382 7.753c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.573-1.066Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

interface SearchSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftMode: SearchMode;
  setDraftMode: (mode: SearchMode) => void;
  draftTopK: number;
  setDraftTopK: (topK: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function SearchSettingsDialog({
  open,
  onOpenChange,
  draftMode,
  setDraftMode,
  draftTopK,
  setDraftTopK,
  onSave,
  onCancel,
}: SearchSettingsDialogProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Buka pengaturan pencarian"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-6 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
      >
        <SettingsIcon />
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan pencarian</DialogTitle>
            <DialogDescription>
              Atur mode pencarian dan jumlah hasil yang dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mode search</label>
              <Select value={draftMode} onValueChange={(value) => setDraftMode(value as SearchMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mode search" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">Hybrid Search</SelectItem>
                  <SelectItem value="knn">Semantic KNN</SelectItem>
                  <SelectItem value="bm25">Keyword BM25</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="top-k" className="mb-2 block text-sm font-medium text-slate-700">Jumlah item</label>
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
            <button type="button" onClick={onCancel} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
              Batal
            </button>
            <button type="button" onClick={onSave} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
              Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}