"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceStatus } from "@/lib/types";

export interface ConvertToInvoiceState {
  error?: string;
}

/**
 * Converts a quote into an invoice: copies the customer, job link, line
 * items and totals, and generates a fresh invoice number. The quote itself
 * is left untouched (still shows as "accepted" or whatever it was) - the
 * invoice is a new, separate record, matching spec section 20.
 */
export async function convertQuoteToInvoice(
  quoteId: string,
  _prevState: ConvertToInvoiceState
): Promise<ConvertToInvoiceState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle();
  if (!quote) {
    return { error: "Quote not found." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, default_payment_terms_days")
    .eq("id", quote.business_id)
    .maybeSingle();
  if (!business) {
    return { error: "Business not found." };
  }

  const { data: items } = await supabase
    .from("quote_items")
    .select("description, quantity, unit_price, tax_rate, total, sort_order")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });

  const { data: invoiceNumber, error: numberError } = await supabase.rpc("next_invoice_number", {
    p_business_id: business.id,
  });
  if (numberError || !invoiceNumber) {
    return { error: "Something went wrong generating an invoice number. Please try again." };
  }

  const dueDate = new Date(Date.now() + business.default_payment_terms_days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      business_id: quote.business_id,
      customer_id: quote.customer_id,
      job_id: quote.job_id,
      quote_id: quote.id,
      invoice_number: invoiceNumber,
      status: "draft",
      subtotal: quote.subtotal,
      gst: quote.gst,
      total: quote.total,
      due_date: dueDate,
      notes: quote.notes,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    return { error: "Something went wrong creating the invoice. Please try again." };
  }

  if (items && items.length > 0) {
    const { error: itemsError } = await supabase.from("invoice_items").insert(
      items.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        total: item.total,
        sort_order: item.sort_order,
      }))
    );
    if (itemsError) {
      return { error: "The invoice was created but its line items failed to copy. Please check it." };
    }
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const supabase = await createClient();
  const update: { status: InvoiceStatus; paid_at?: string | null } = { status };
  if (status === "paid") {
    update.paid_at = new Date().toISOString();
  }
  await supabase.from("invoices").update(update).eq("id", invoiceId);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
}
