import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { InvoiceStatusActions } from "./invoice-status-actions";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers ( id, first_name, last_name, phone, email )")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) {
    notFound();
  }

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sort_order", { ascending: true });

  const customer = (invoice as any).customers;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{invoice.invoice_number}</h1>
          <p className="text-sm text-ink-500">
            {invoice.due_date ? `Due ${formatDate(invoice.due_date)}` : "No due date set"}
            {invoice.paid_at ? ` · Paid ${formatDateTime(invoice.paid_at)}` : ""}
          </p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <InvoiceStatusActions invoiceId={invoice.id} status={invoice.status} />
        <a href={`/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary">View / Download PDF</Button>
        </a>
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
        <h2 className="mb-3 text-base font-semibold text-ink-900">Line items</h2>
        <ul className="divide-y divide-ink-100">
          {(items ?? []).map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="text-ink-900">{item.description}</p>
                <p className="text-xs text-ink-500">
                  {item.quantity} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="font-medium text-ink-900">{formatCurrency(item.total)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-ink-100 pt-4 text-sm">
          <div className="flex justify-between text-ink-500">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>GST</span>
            <span>{formatCurrency(invoice.gst)}</span>
          </div>
          <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-4 border-t border-ink-100 pt-4">
            <p className="mb-1 text-xs text-ink-500">Notes</p>
            <p className="text-sm text-ink-900">{invoice.notes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
