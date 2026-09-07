import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function QuotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, title, status, total, valid_until, customers ( first_name, last_name )")
    .eq("business_id", business!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Quotes</h1>
        <Link href="/quotes/new">
          <Button>+ Create Quote</Button>
        </Link>
      </div>

      {!quotes || quotes.length === 0 ? (
        <Card className="text-center">
          <p className="mb-1 font-medium text-ink-900">No quotes yet.</p>
          <p className="mb-4 text-sm text-ink-500">Create your first quote in under a minute.</p>
          <Link href="/quotes/new">
            <Button>Create Quote</Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-ink-100 p-0">
          {quotes.map((q: any) => (
            <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-ink-900">
                  {q.customers ? `${q.customers.first_name} ${q.customers.last_name ?? ""}` : q.quote_number}
                </p>
                <p className="text-xs text-ink-500">
                  {q.quote_number}
                  {q.title ? ` · ${q.title}` : ""}
                  {q.valid_until ? ` · valid until ${formatDate(q.valid_until)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink-900">{formatCurrency(q.total)}</span>
                <StatusBadge status={q.status} />
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
