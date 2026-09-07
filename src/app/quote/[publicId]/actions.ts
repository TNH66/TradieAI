"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export interface QuoteResponseState {
  error?: string;
}

const RESPONDABLE_STATUSES = ["sent", "viewed"];

export async function acceptQuote(
  publicId: string,
  _prevState: QuoteResponseState
): Promise<QuoteResponseState> {
  if (!checkRateLimit(`quote-response:${publicId}`, 10, 60 * 1000)) {
    return { error: "Too many attempts. Please wait a moment and try again." };
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("quotes")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("public_id", publicId)
    .in("status", RESPONDABLE_STATUSES)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "This quote can no longer be accepted. Please contact the business directly." };
  }

  revalidatePath(`/quote/${publicId}`);
  return {};
}

export async function declineQuote(
  publicId: string,
  _prevState: QuoteResponseState
): Promise<QuoteResponseState> {
  if (!checkRateLimit(`quote-response:${publicId}`, 10, 60 * 1000)) {
    return { error: "Too many attempts. Please wait a moment and try again." };
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("quotes")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("public_id", publicId)
    .in("status", RESPONDABLE_STATUSES)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "This quote can no longer be declined. Please contact the business directly." };
  }

  revalidatePath(`/quote/${publicId}`);
  return {};
}

/** Marks a freshly-opened quote as "viewed" - only ever moves sent -> viewed, never overrides any other status. */
export async function markQuoteViewed(publicId: string) {
  const supabase = createServiceRoleClient();
  await supabase.from("quotes").update({ status: "viewed" }).eq("public_id", publicId).eq("status", "sent");
}

/** Auto-flags a quote as expired once its valid_until date has passed, unless it's already been responded to. */
export async function markQuoteExpiredIfPastValidity(publicId: string) {
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("quotes")
    .update({ status: "expired" })
    .eq("public_id", publicId)
    .lt("valid_until", today)
    .in("status", ["draft", "sent", "viewed"]);
}
