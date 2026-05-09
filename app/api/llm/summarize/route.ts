import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

type HaditsItem = {
    nama_perawi: string;
    nomor_hadits: number;
    referensi_lengkap: string;
    terjemahan: string;
};

type SummarizePayload = {
    query?: string;
    hadits_results?: HaditsItem[];
};

export async function POST(request: NextRequest) {
    let payload: SummarizePayload;

    try {
        payload = (await request.json()) as SummarizePayload;
    } catch {
        return NextResponse.json(
            { detail: "Payload tidak valid." },
            { status: 400 }
        );
    }

    const trimmedQuery = payload.query?.trim();
    const haditsResults = (payload.hadits_results ?? []).slice(0, 3);

    // Validasi
    if (!trimmedQuery || trimmedQuery.length < 3) {
        return NextResponse.json(
            { detail: "Query minimal 3 karakter." },
            { status: 400 }
        );
    }

    if (!Array.isArray(haditsResults) || haditsResults.length === 0) {
        return NextResponse.json(
            { detail: "hadits_results tidak boleh kosong." },
            { status: 400 }
        );
    }

    const endpoint = `${backendBaseUrl}/llm/summarize`;

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: trimmedQuery,
                hadits_results: haditsResults,
            }),
            cache: "no-store",
        });

        const text = await response.text();


        if (!response.ok) {
            return NextResponse.json(
                text ?? { detail: "Gagal melakukan summarize ke backend." },
                { status: response.status }
            );
        }

        return NextResponse.json({
            summary: text,
        });
    } catch {
        return NextResponse.json(
            {
                detail:
                    "Frontend tidak bisa menjangkau backend summarize. Pastikan API FastAPI aktif.",
            },
            { status: 502 }
        );
    }
}