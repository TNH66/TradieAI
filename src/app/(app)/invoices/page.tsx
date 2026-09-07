import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, due_date, customers ( first_name, last_name )")
    .eq("business_id", business!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Invoices</h1>

      {!invoices || invoices.length === 0 ? (
        <Card className="text-center">
          <p className="mb-1 font-medium text-ink-900">No invoices yet.</p>
          <p className="text-sm text-ink-500">
            Convert an accepted quote into an invoice from the quote's detail page.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-ink-100 p-0">
          {invoices.map((inv: any) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="font-medium text-ink-900">
                  {inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name ?? ""}` : inv.invoice_number}
                </p>
                <p className="text-xs text-ink-500">
                  {inv.invoice_number}
                  {inv.due_date ? ` · due ${formatDate(inv.due_date)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink-900">{formatCurrency(inv.total)}</span>
                <StatusBadge status={inv.status} />
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
