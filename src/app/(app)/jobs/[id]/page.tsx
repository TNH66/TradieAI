import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { JobStatusActions } from "./job-status-actions";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, customers ( id, first_name, last_name, phone, email )")
    .eq("id", id)
    .maybeSingle();

  if (!job) {
    notFound();
  }

  const [{ data: quotes }, { data: invoices }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, status, total")
      .eq("job_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total")
      .eq("job_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const customer = (job as any).customers;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{job.title}</h1>
          <p className="text-sm text-ink-500">{job.job_number}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/quotes/new?jobId=${job.id}${customer ? `&customerId=${customer.id}` : ""}`}>
          <Button size="md">Create Quote</Button>
        </Link>
        <Link href={`/jobs/${job.id}/edit`}>
          <Button size="md" variant="secondary">
            Edit Job
          </Button>
        </Link>
        <JobStatusActions jobId={job.id} status={job.status} />
      </div>

      {customer && (
        <Card>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Customer</h2>
          <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-brand-700 hover:underline">
            {customer.first_name} {customer.last_name}
          </Link>
          <div className="mt-1 space-y-0.5 text-sm text-ink-500">
            {customer.phone && <p>{customer.phone}</p>}
            {customer.email && <p>{customer.email}</p>}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-2 text-base font-semibold text-ink-900">Job details</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-500">Scheduled</dt>
            <dd className="font-medium text-ink-900">{formatDateTime(job.scheduled_at)}</dd>
          </div>
          {job.description && (
            <div>
              <dt className="text-ink-500">Description</dt>
              <dd className="text-ink-900">{job.description}</dd>
            </div>
          )}
          {job.notes && (
            <div>
              <dt className="text-ink-500">Notes</dt>
              <dd className="text-ink-900">{job.notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <h2 className="mb-2 text-base font-semibold text-ink-900">Photos</h2>
        <p className="text-sm text-ink-500">Photo uploads are coming soon.</p>
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-ink-900">Quotes</h2>
        {!quotes || quotes.length === 0 ? (
          <p className="text-sm text-ink-500">No quotes yet for this job.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {quotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-ink-900">{q.quote_number}</span>
                <StatusBadge status={q.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-ink-900">Invoices</h2>
        {!invoices || invoices.length === 0 ? (
          <p className="text-sm text-ink-500">No invoices yet for this job.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {invoices.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-ink-900">{i.invoice_number}</span>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
