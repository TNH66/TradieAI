import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { fetchInvoicePdfData } from "@/lib/pdf/fetch-invoice-pdf-data";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS scopes this to invoices belonging to the signed-in user's own business.
  const data = await fetchInvoicePdfData(supabase, id);

  if (!data) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  try {
    const pdfBytes = await generateInvoicePdf(data);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${data.invoice.invoice_number}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Invoice PDF generation failed:", err);
    return NextResponse.json({ error: "Something went wrong generating the PDF." }, { status: 500 });
  }
}
