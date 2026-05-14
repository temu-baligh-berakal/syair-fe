import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type SearchPayload = {
  query?: string;
  page?: number;
  page_size?: number;
  nama_perawi?: string | null;
  mode?: string;
};

export async function POST(request: NextRequest) {
  let payload: SearchPayload;

  try {
    payload = (await request.json()) as SearchPayload;
  } catch {
    return NextResponse.json(
      { detail: "Payload tidak valid." },
      { status: 400 },
    );
  }

  const trimmedQuery = payload.query?.trim();
  const trimmedNarrator = payload.nama_perawi?.trim();
  const page = payload.page ?? 1;
  const pageSize = payload.page_size ?? 10;
  const mode = payload.mode ?? "knn";

  if (!trimmedQuery || trimmedQuery.length < 3) {
    return NextResponse.json(
      { detail: "Query minimal 3 karakter." },
      { status: 400 },
    );
  }

  const endpoint = trimmedNarrator
    ? `${backendBaseUrl}/hadits/advanced-search`
    : `${backendBaseUrl}/hadits/search`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: trimmedQuery,
        page: page,
        page_size: pageSize,
        nama_perawi: trimmedNarrator || undefined,
        mode,
      }),
      cache: "no-store",
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return NextResponse.json(
        data ?? { detail: "Gagal mengambil data dari backend." },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        detail:
          "Frontend tidak bisa menjangkau backend. Pastikan API FastAPI aktif dan BACKEND_API_URL benar.",
      },
      { status: 502 },
    );
  }
}
