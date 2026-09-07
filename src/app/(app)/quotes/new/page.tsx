import { createClient } from "@/lib/supabase/server";
import { NewQuoteForm } from "./new-quote-form";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; jobId?: string }>;
}) {
  const { customerId, jobId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, gst_registered, prices_include_gst, default_quote_valid_days")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const [{ data: customers }, { data: jobs }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, first_name, last_name")
      .eq("business_id", business!.id)
      .order("first_name", { ascending: true }),
    supabase
      .from("jobs")
      .select("id, title, job_number")
      .eq("business_id", business!.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Create Quote</h1>
      <NewQuoteForm
        customers={customers ?? []}
        jobs={jobs ?? []}
        business={business!}
        defaultCustomerId={customerId}
        defaultJobId={jobId}
      />
    </div>
  );
}
