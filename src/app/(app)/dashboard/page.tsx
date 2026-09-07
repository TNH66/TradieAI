import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user!.id)
    .maybeSingle();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const businessId = business!.id;

  const [
    { count: openJobsCount },
    { count: pendingQuotesCount },
    { count: acceptedQuotesCount },
    { count: outstandingInvoicesCount },
    { data: recentJobs },
    { data: recentQuotes },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["new", "scheduled", "in_progress"]),
    supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["sent", "viewed"]),
    supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "accepted"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["sent", "overdue"]),
    supabase
      .from("jobs")
      .select("id, job_number, title, status, scheduled_at, customers ( first_name, last_name )")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("quotes")
      .select("id, quote_number, title, status, total, customers ( first_name, last_name )")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Open Jobs", value: openJobsCount ?? 0 },
    { label: "Pending Quotes", value: pendingQuotesCount ?? 0 },
    { label: "Accepted Quotes", value: acceptedQuotesCount ?? 0 },
    { label: "Outstanding Invoices", value: outstandingInvoicesCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">
          G'day{profile?.first_name ? `, ${profile.first_name}` : ""} 👋
        </h1>
        <p className="text-sm text-ink-500">Here's what's happening today.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/quotes/new">
          <Button>+ Create Quote</Button>
        </Link>
        <Link href="/jobs/new">
          <Button variant="secondary">+ Create Job</Button>
        </Link>
        <Link href="/customers/new">
          <Button variant="secondary">+ Add Customer</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-ink-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-ink-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">Recent jobs</h2>
          <Link href="/jobs" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {!recentJobs || recentJobs.length === 0 ? (
          <p className="text-sm text-ink-500">No jobs yet. Create your first job to get started.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {recentJobs.map((j: any) => (
              <li key={j.id}>
                <Link href={`/jobs/${j.id}`} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{j.title}</p>
                    <p className="text-xs text-ink-500">
                      {j.customers ? `${j.customers.first_name} ${j.customers.last_name ?? ""}` : j.job_number}
                      {j.scheduled_at ? ` · ${formatDate(j.scheduled_at)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={j.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">Recent quotes</h2>
          <Link href="/quotes" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {!recentQuotes || recentQuotes.length === 0 ? (
          <p className="text-sm text-ink-500">No quotes yet. Quoting lands in Phase 3.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {recentQuotes.map((q: any) => (
              <li key={q.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {q.customers ? `${q.customers.first_name} ${q.customers.last_name ?? ""}` : q.quote_number}
                  </p>
                  <p className="text-xs text-ink-500">{q.title ?? q.quote_number}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-900">{formatCurrency(q.total)}</span>
                  <StatusBadge status={q.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
