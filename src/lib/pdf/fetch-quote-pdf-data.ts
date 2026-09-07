import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuotePdfData } from "./quote-pdf";

/**
 * Fetches everything generateQuotePdf() needs for a given quote ID, using
 * whichever Supabase client the caller passes in - a regular RLS-scoped
 * client for the authenticated tradie-facing route, or a service-role
 * client for the public route (which looks the quote up by public_id first).
 */
export async function fetchQuotePdfData(
  supabase: SupabaseClient,
  quoteId: string
): Promise<QuotePdfData | null> {
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle();
  if (!quote) return null;

  const [{ data: business }, { data: customer }, { data: items }] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, abn, phone, email, address, suburb, state, postcode, default_payment_terms_days, logo_url")
      .eq("id", quote.business_id)
      .maybeSingle(),
    quote.customer_id
      ? supabase
          .from("customers")
          .select("first_name, last_name, company, email, phone, address, suburb, state, postcode")
          .eq("id", quote.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("quote_items")
      .select("description, quantity, unit_price, total")
      .eq("quote_id", quoteId)
      .order("sort_order", { ascending: true }),
  ]);

  if (!business) return null;

  return {
    business,
    quote,
    customer: customer ?? null,
    items: items ?? [],
  };
}
