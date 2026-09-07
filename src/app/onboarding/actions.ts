"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TradeType } from "@/lib/types";

export interface OnboardingState {
  error?: string;
}

const VALID_TRADES: TradeType[] = ["plumbing", "electrical", "hvac", "building", "carpentry", "other"];

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const abn = String(formData.get("abn") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const suburb = String(formData.get("suburb") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  const trade = String(formData.get("trade") ?? "plumbing") as TradeType;
  const gstRegistered = formData.get("gstRegistered") === "yes";
  const pricesIncludeGst = formData.get("pricesIncludeGst") !== "exclusive";
  const defaultLabourRate = Number(formData.get("defaultLabourRate") ?? 0) || 0;
  const defaultCalloutFee = Number(formData.get("defaultCalloutFee") ?? 0) || 0;

  if (!name) {
    return { error: "Business name is required." };
  }
  if (!VALID_TRADES.includes(trade)) {
    return { error: "Please select a valid trade." };
  }

  const { error } = await supabase.from("businesses").insert({
    owner_id: user.id,
    name,
    abn: abn || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
    suburb: suburb || null,
    state: state || null,
    postcode: postcode || null,
    trade,
    gst_registered: gstRegistered,
    // Only meaningful when GST-registered, but harmless to store either way.
    prices_include_gst: pricesIncludeGst,
    default_labour_rate: defaultLabourRate,
    default_callout_fee: defaultCalloutFee,
  });

  if (error) {
    return { error: "Something went wrong saving your business details. Please try again." };
  }

  redirect("/dashboard");
}
