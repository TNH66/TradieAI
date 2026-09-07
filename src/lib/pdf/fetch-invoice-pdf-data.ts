import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoicePdfData } from "./invoice-pdf";

export async function fetchInvoicePdfData(
  supabase: SupabaseClient,
  invoiceId: string
): Promise<InvoicePdfData | null> {
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (!invoice) return null;

  const [{ data: business }, { data: customer }, { data: items }] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, abn, phone, email, address, suburb, state, postcode, default_payment_terms_days, logo_url")
      .eq("id", invoice.business_id)
      .maybeSingle(),
    invoice.customer_id
      ? supabase
          .from("customers")
          .select("first_name, last_name, company, email, phone, address, suburb, state, postcode")
          .eq("id", invoice.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("invoice_items")
      .select("description, quantity, unit_price, total")
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true }),
  ]);

  if (!business) return null;

  return {
    business,
    invoice,
    customer: customer ?? null,
    items: items ?? [],
  };
}
