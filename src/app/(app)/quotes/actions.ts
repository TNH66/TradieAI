"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateQuoteTotals, type QuoteLineInput } from "@/lib/quote-calc";
import type { QuoteStatus } from "@/lib/types";

export interface QuoteFormState {
  error?: string;
}

async function getBusiness(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, gst_registered, prices_include_gst, default_quote_valid_days")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) redirect("/onboarding");

  return business;
}

/** Parses the line items the client serialised into a hidden JSON field. */
function parseLineItems(formData: FormData): QuoteLineInput[] {
  const raw = String(formData.get("itemsJson") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      description: String(item?.description ?? "").trim(),
      quantity: Number(item?.quantity) || 0,
      unitPrice: Number(item?.unitPrice) || 0,
    }))
    .filter((item) => item.description && item.quantity > 0);
}

function quoteFieldsFromForm(formData: FormData) {
  return {
    customer_id: String(formData.get("customerId") ?? "").trim() || null,
    job_id: String(formData.get("jobId") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    valid_until: String(formData.get("validUntil") ?? "").trim() || null,
  };
}

export async function createQuote(
  _prevState: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const supabase = await createClient();
  const business = await getBusiness(supabase);
  const fields = quoteFieldsFromForm(formData);
  const items = parseLineItems(formData);

  if (items.length === 0) {
    return { error: "Add at least one line item before saving." };
  }

  const totals = calculateQuoteTotals(items, business.gst_registered, business.prices_include_gst);

  const { data: quoteNumber, error: numberError } = await supabase.rpc("next_quote_number", {
    p_business_id: business.id,
  });

  if (numberError || !quoteNumber) {
    return { error: "Something went wrong generating a quote number. Please try again." };
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      business_id: business.id,
      quote_number: quoteNumber,
      status: "draft",
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      ...fields,
    })
    .select("id")
    .single();

  if (quoteError || !quote) {
    return { error: "Something went wrong creating this quote. Please try again." };
  }

  const { error: itemsError } = await supabase.from("quote_items").insert(
    totals.lines.map((line, index) => ({
      quote_id: quote.id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      tax_rate: totals.taxRate,
      total: line.lineAmount,
      sort_order: index,
    }))
  );

  if (itemsError) {
    return { error: "The quote was created but its line items failed to save. Please edit and re-save." };
  }

  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuote(
  quoteId: string,
  _prevState: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const supabase = await createClient();
  const business = await getBusiness(supabase);
  const fields = quoteFieldsFromForm(formData);
  const items = parseLineItems(formData);

  if (items.length === 0) {
    return { error: "Add at least one line item before saving." };
  }

  const totals = calculateQuoteTotals(items, business.gst_registered, business.prices_include_gst);

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      ...fields,
    })
    .eq("id", quoteId);

  if (quoteError) {
    return { error: "Something went wrong saving these changes. Please try again." };
  }

  // Simplest correct approach for V1: replace the full item set rather than
  // diffing individual rows. Acceptable at this scale; revisit if quotes
  // ever need concurrent multi-user editing.
  await supabase.from("quote_items").delete().eq("quote_id", quoteId);

  const { error: itemsError } = await supabase.from("quote_items").insert(
    totals.lines.map((line, index) => ({
      quote_id: quoteId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      tax_rate: totals.taxRate,
      total: line.lineAmount,
      sort_order: index,
    }))
  );

  if (itemsError) {
    return { error: "Changes were saved but line items failed to update. Please try again." };
  }

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/dashboard");
  redirect(`/quotes/${quoteId}`);
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const supabase = await createClient();
  await supabase.from("quotes").update({ status }).eq("id", quoteId);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/dashboard");
}
