"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateSequentialNumber } from "@/lib/sequence";
import type { JobStatus } from "@/lib/types";

export interface JobFormState {
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

function jobFieldsFromForm(formData: FormData) {
  const scheduledDate = String(formData.get("scheduledDate") ?? "").trim();
  const scheduledTime = String(formData.get("scheduledTime") ?? "").trim();
  let scheduled_at: string | null = null;
  if (scheduledDate) {
    scheduled_at = new Date(`${scheduledDate}T${scheduledTime || "09:00"}:00`).toISOString();
  }

  return {
    customer_id: String(formData.get("customerId") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    scheduled_at,
  };
}

export async function createJob(_prevState: JobFormState, formData: FormData): Promise<JobFormState> {
  const supabase = await createClient();
  const businessId = await getBusinessId(supabase);
  const fields = jobFieldsFromForm(formData);

  if (!fields.title) {
    return { error: "Job title is required." };
  }

  const jobNumber = await generateSequentialNumber(supabase, "jobs", "job_number", businessId, "J-");

  const { data, error } = await supabase
    .from("jobs")
    .insert({ business_id: businessId, job_number: jobNumber, status: "new", ...fields })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Something went wrong creating this job. Please try again." };
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  redirect(`/jobs/${data.id}`);
}

export async function updateJob(
  jobId: string,
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const supabase = await createClient();
  await getBusinessId(supabase);
  const fields = jobFieldsFromForm(formData);

  if (!fields.title) {
    return { error: "Job title is required." };
  }

  const { error } = await supabase.from("jobs").update(fields).eq("id", jobId);

  if (error) {
    return { error: "Something went wrong saving these changes. Please try again." };
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const supabase = await createClient();
  await supabase.from("jobs").update({ status }).eq("id", jobId);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}
