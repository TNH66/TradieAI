import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();

  if (!customer) {
    notFound();
  }

  const [{ data: jobs }, { data: quotes }, { data: invoices }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, job_number, title, status, scheduled_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, quote_number, title, status, total")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, paid_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const totalQuoted = (quotes ?? []).reduce((sum, q) => sum + Number(q.total ?? 0), 0);
  const totalInvoiced = (invoices ?? []).reduce((sum, i) => sum + Number(i.total ?? 0), 0);
  const totalPaid = (invoices ?? [])
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">
            {customer.first_name} {customer.last_name}
          </h1>
          {customer.company && <p className="text-sm text-ink-500">{customer.company}</p>}
        </div>
        <Link href={`/customers/${customer.id}/edit`}>
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/jobs/new?customerId=${customer.id}`}>
          <Button size="md" variant="secondary">
            Create Job
          </Button>
        </Link>
        <Link href={`/quotes/new?customerId=${customer.id}`}>
          <Button size="md" variant="secondary">
            Create Quote
          </Button>
        </Link>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-ink-900">Details</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Phone" value={customer.phone} />
          <Field label="Email" value={customer.email} />
          <Field label="Address" value={customer.address} />
          <Field
            label="Suburb / State / Postcode"
            value={[customer.suburb, customer.state, customer.postcode].filter(Boolean).join(" ") || null}
          />
        </dl>
        {customer.notes && (
          <div className="mt-3 border-t border-ink-100 pt-3">
            <p className="text-sm text-ink-500">Notes</p>
            <p className="text-sm text-ink-900">{customer.notes}</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-ink-500">Total quoted</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{formatCurrency(totalQuoted)}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-500">Total invoiced</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{formatCurrency(totalInvoiced)}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-500">Total paid</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{formatCurrency(totalPaid)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-base font-semibold text-ink-900">Jobs</h2>
        {!jobs || jobs.length === 0 ? (
          <p className="text-sm text-ink-500">No jobs yet for this customer.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {jobs.map((j) => (
              <li key={j.id} className="py-3">
                <Link href={`/jobs/${j.id}`} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{j.title}</p>
                    <p className="text-xs text-ink-500">
                      {j.job_number} · {formatDate(j.scheduled_at)}
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
        <h2 className="mb-3 text-base font-semibold text-ink-900">Quotes</h2>
        {!quotes || quotes.length === 0 ? (
          <p className="text-sm text-ink-500">No quotes yet for this customer.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {quotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{q.title ?? q.quote_number}</p>
                  <p className="text-xs text-ink-500">{q.quote_number}</p>
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

      <Card>
        <h2 className="mb-3 text-base font-semibold text-ink-900">Invoices</h2>
        {!invoices || invoices.length === 0 ? (
          <p className="text-sm text-ink-500">No invoices yet for this customer.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {invoices.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-3">
                <p className="text-sm font-medium text-ink-900">{i.invoice_number}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-900">{formatCurrency(i.total)}</span>
                  <StatusBadge status={i.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value || "—"}</dd>
    </div>
  );
}
