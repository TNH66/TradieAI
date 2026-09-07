"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CustomerFormState {
  error?: string;
}

async function getBusinessId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) redirect("/onboarding");

  return business.id;
}

function customerFieldsFromForm(formData: FormData) {
  return {
    first_name: String(formData.get("firstName") ?? "").trim(),
    last_name: String(formData.get("lastName") ?? "").trim() || null,
    company: String(formData.get("company") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    suburb: String(formData.get("suburb") ?? "").trim() || null,
    state: String(formData.get("state") ?? "").trim() || null,
    postcode: String(formData.get("postcode") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const supabase = await createClient();
  const businessId = await getBusinessId(supabase);
  const fields = customerFieldsFromForm(formData);

  if (!fields.first_name) {
    return { error: "First name is required." };
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({ business_id: businessId, ...fields })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Something went wrong adding this customer. Please try again." };
  }

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const supabase = await createClient();
  await getBusinessId(supabase); // ensures the caller has a business; RLS scopes the update itself
  const fields = customerFieldsFromForm(formData);

  if (!fields.first_name) {
    return { error: "First name is required." };
  }

  const { error } = await supabase.from("customers").update(fields).eq("id", customerId);

  if (error) {
    return { error: "Something went wrong saving these changes. Please try again." };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}
