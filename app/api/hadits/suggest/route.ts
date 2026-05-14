import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ query: q, suggestions: [] });
  }

  try {
    const response = await fetch(`${backendBaseUrl}/hadits/suggest?q=${encodeURIComponent(q)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        data ?? { detail: "Gagal mengambil saran dari backend." },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        detail: "Frontend tidak bisa menjangkau backend.",
      },
      { status: 502 },
    );
  }
}
