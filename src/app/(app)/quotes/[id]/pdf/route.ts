import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuotePdf } from "@/lib/pdf/quote-pdf";
import { fetchQuotePdfData } from "@/lib/pdf/fetch-quote-pdf-data";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS scopes this to quotes belonging to the signed-in user's own business -
  // a quote ID for someone else's business simply won't be found.
  const data = await fetchQuotePdfData(supabase, id);

  if (!data) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  try {
    const pdfBytes = await generateQuotePdf(data);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${data.quote.quote_number}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json({ error: "Something went wrong generating the PDF." }, { status: 500 });
  }
}
