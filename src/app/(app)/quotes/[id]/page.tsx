import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { QuoteStatusActions } from "./quote-status-actions";
import { EditQuoteForm } from "./edit-quote-form";
import { CopyPublicLink } from "./copy-public-link";
import { ConvertToInvoiceButton } from "./convert-to-invoice-button";
import type { Quote, QuoteItem } from "../types";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();

  if (!quote) {
    notFound();
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, gst_registered, prices_include_gst, default_quote_valid_days")
    .eq("id", quote.business_id)
    .maybeSingle();

  const [{ data: items }, { data: customers }, { data: jobs }, { data: existingInvoice }] = await Promise.all([
    supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order", { ascending: true }),
    supabase
      .from("customers")
      .select("id, first_name, last_name")
      .eq("business_id", quote.business_id)
      .order("first_name", { ascending: true }),
    supabase
      .from("jobs")
      .select("id, title, job_number")
      .eq("business_id", quote.business_id)
      .order("created_at", { ascending: false }),
    supabase.from("invoices").select("id, invoice_number").eq("quote_id", id).maybeSingle(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{quote.quote_number}</h1>
          <p className="text-sm text-ink-500">
            {quote.valid_until ? `Valid until ${formatDate(quote.valid_until)}` : "No expiry set"}
          </p>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <QuoteStatusActions quoteId={quote.id} status={quote.status} />
        <a href={`/quotes/${quote.id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary">View / Download PDF</Button>
        </a>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink-900">Invoice</p>
            <p className="text-xs text-ink-500">
              {existingInvoice
                ? `Already converted to ${existingInvoice.invoice_number}.`
                : "Once the customer's ready to be billed, convert this quote into an invoice."}
            </p>
          </div>
          {existingInvoice ? (
            <a href={`/invoices/${existingInvoice.id}`}>
              <Button variant="secondary">View Invoice</Button>
            </a>
          ) : (
            <ConvertToInvoiceButton quoteId={quote.id} />
          )}
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-medium text-ink-900">Customer link</p>
        <p className="mb-3 text-xs text-ink-500">
          Share this with your customer so they can view, accept, or decline the quote.
        </p>
        <CopyPublicLink url={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/quote/${quote.public_id}`} />
      </Card>

      <Card>
        <p className="text-sm text-ink-500">
          Editing and saving below recalculates the subtotal, GST and total automatically -
          amounts are never taken on faith from the form.
        </p>
      </Card>

      <EditQuoteForm
        quote={quote as Quote}
        items={(items ?? []) as QuoteItem[]}
        customers={customers ?? []}
        jobs={jobs ?? []}
        business={business!}
      />
    </div>
  );
}
