import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_number, title, status, scheduled_at, customers ( first_name, last_name )")
    .eq("business_id", business!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Jobs</h1>
        <Link href="/jobs/new">
          <Button>+ Create Job</Button>
        </Link>
      </div>

      {!jobs || jobs.length === 0 ? (
        <Card className="text-center">
          <p className="mb-1 font-medium text-ink-900">No jobs yet.</p>
          <p className="mb-4 text-sm text-ink-500">Create your first job to start quoting.</p>
          <Link href="/jobs/new">
            <Button>Create Job</Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-ink-100 p-0">
          {jobs.map((j: any) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-ink-900">{j.title}</p>
                <p className="text-xs text-ink-500">
                  {j.job_number}
                  {j.customers ? ` · ${j.customers.first_name} ${j.customers.last_name ?? ""}` : ""}
                  {j.scheduled_at ? ` · ${formatDate(j.scheduled_at)}` : ""}
                </p>
              </div>
              <StatusBadge status={j.status} />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
