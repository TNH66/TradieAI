import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditJobForm } from "./edit-job-form";
import type { Job } from "../../types";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();

  if (!job) {
    notFound();
  }

  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("business_id", job.business_id)
    .order("first_name", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Edit Job</h1>
      <EditJobForm job={job as Job} customers={customers ?? []} />
    </div>
  );
}
