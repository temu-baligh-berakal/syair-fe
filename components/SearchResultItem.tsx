import { SearchResult } from "@/app/types/search";

export default function SearchResultItem({ item }: { item: SearchResult }) {
  return (
    <article>
      <p className="text-sm text-[#202124]">{item.nama_perawi}</p>
      <h2 className="mt-1 text-[22px] font-normal leading-7 text-[#1a0dab] hover:underline cursor-pointer">
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
  );
}