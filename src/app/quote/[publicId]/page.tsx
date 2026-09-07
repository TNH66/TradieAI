import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { markQuoteExpiredIfPastValidity, markQuoteViewed } from "./actions";
import { QuoteResponseActions } from "./response-actions";

async function loadQuote(publicId: string, supabase: ReturnType<typeof createServiceRoleClient>) {
  const { data: quote } = await supabase.from("quotes").select("*").eq("public_id", publicId).maybeSingle();
  return quote;
}

export default async function PublicQuotePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const supabase = createServiceRoleClient();

  let quote = await loadQuote(publicId, supabase);
  if (!quote) {
    notFound();
  }

  // Housekeeping side effects - each is a narrowly-scoped, idempotent status
  // transition guarded by public_id, so it's safe to run on every page view.
  await markQuoteExpiredIfPastValidity(publicId);
  if (quote.status === "sent") {
    await markQuoteViewed(publicId);
  }
  quote = await loadQuote(publicId, supabase);
  if (!quote) {
    notFound();
  }

  const [{ data: business }, { data: customer }, { data: items }] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, abn, phone, email, address, suburb, state, postcode")
      .eq("id", quote.business_id)
      .maybeSingle(),
    quote.customer_id
      ? supabase.from("customers").select("first_name, last_name").eq("id", quote.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("quote_items")
      .select("description, quantity, unit_price, total")
      .eq("quote_id", quote.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!business) {
    notFound();
  }

  const canRespond = quote.status === "sent" || quote.status === "viewed";
  const customerName = customer ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") : null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-1 flex items-start justify-between gap-3">
          <h1 className="text-lg font-semibold text-ink-900">{business.name}</h1>
          <StatusBadge status={quote.status} />
        </div>
        <div className="space-y-0.5 text-xs text-ink-500">
          {business.address && <p>{business.address}</p>}
          {(business.suburb || business.state) && (
            <p>
              {[business.suburb, business.state, business.postcode].filter(Boolean).join(" ")}
            </p>
          )}
          {business.abn && <p>ABN {business.abn}</p>}
          {business.phone && <p>{business.phone}</p>}
          {business.email && <p>{business.email}</p>}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Quote</p>
            <p className="text-lg font-semibold text-ink-900">{quote.quote_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink-500">Valid until</p>
            <p className="text-sm font-medium text-ink-900">{formatDate(quote.valid_until)}</p>
          </div>
        </div>

        {customerName && (
          <div className="mb-3">
            <p className="text-xs text-ink-500">Prepared for</p>
            <p className="text-sm font-medium text-ink-900">{customerName}</p>
          </div>
        )}

        {quote.title && (
          <div className="mb-4">
            <p className="text-xs text-ink-500">Job</p>
            <p className="text-sm text-ink-900">{quote.title}</p>
          </div>
        )}

        <div className="divide-y divide-ink-100 border-y border-ink-100">
          {(items ?? []).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="text-ink-900">{item.description}</p>
                <p className="text-xs text-ink-500">
                  {item.quantity} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="font-medium text-ink-900">{formatCurrency(item.total)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between text-ink-500">
            <span>Subtotal</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>GST</span>
            <span>{formatCurrency(quote.gst)}</span>
          </div>
          <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-4 border-t border-ink-100 pt-4">
            <p className="mb-1 text-xs text-ink-500">Notes</p>
            <p className="text-sm text-ink-900">{quote.notes}</p>
          </div>
        )}
      </Card>

      <Card>
        {canRespond && <QuoteResponseActions publicId={publicId} />}

        {quote.status === "accepted" && (
          <p className="text-center text-sm font-medium text-green-700">
            You accepted this quote{quote.responded_at ? ` on ${formatDateTime(quote.responded_at)}` : ""}.
            The business will be in touch to arrange next steps.
          </p>
        )}
        {quote.status === "declined" && (
          <p className="text-center text-sm font-medium text-ink-500">
            You declined this quote{quote.responded_at ? ` on ${formatDateTime(quote.responded_at)}` : ""}.
            Get in touch with {business.name} if you'd like to discuss it further.
          </p>
        )}
        {quote.status === "expired" && (
          <p className="text-center text-sm font-medium text-ink-500">
            This quote has expired. Please contact {business.name} for an updated quote.
          </p>
        )}

        <a
          href={`/quote/${publicId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-sm font-medium text-brand-700 hover:underline"
        >
          Download PDF
        </a>
      </Card>
    </div>
  );
}
