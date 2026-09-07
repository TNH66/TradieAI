import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("business_id", business!.id)
    .order("first_name", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Create Job</h1>
      <NewJobForm customers={customers ?? []} defaultCustomerId={customerId} />
    </div>
  );
}
