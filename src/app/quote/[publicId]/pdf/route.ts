import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateQuotePdf } from "@/lib/pdf/quote-pdf";
import { fetchQuotePdfData } from "@/lib/pdf/fetch-quote-pdf-data";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const supabase = createServiceRoleClient();

  const { data: quoteRef } = await supabase.from("quotes").select("id").eq("public_id", publicId).maybeSingle();

  if (!quoteRef) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  const data = await fetchQuotePdfData(supabase, quoteRef.id);
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
    console.error("Public PDF generation failed:", err);
    return NextResponse.json({ error: "Something went wrong generating the PDF." }, { status: 500 });
  }
}
