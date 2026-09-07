import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CustomersPage() {
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
    .select("id, first_name, last_name, company, phone, email, suburb, state")
    .eq("business_id", business!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Customers</h1>
        <Link href="/customers/new">
          <Button>+ Add Customer</Button>
        </Link>
      </div>

      {!customers || customers.length === 0 ? (
        <Card className="text-center">
          <p className="mb-1 font-medium text-ink-900">No customers yet.</p>
          <p className="mb-4 text-sm text-ink-500">
            Add your first customer to start creating jobs and quotes.
          </p>
          <Link href="/customers/new">
            <Button>Add Customer</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="h-full transition-colors hover:border-brand-200">
                <p className="font-medium text-ink-900">
                  {c.first_name} {c.last_name}
                </p>
                {c.company && <p className="text-sm text-ink-500">{c.company}</p>}
                <div className="mt-2 space-y-0.5 text-sm text-ink-500">
                  {c.phone && <p>{c.phone}</p>}
                  {c.email && <p>{c.email}</p>}
                  {(c.suburb || c.state) && (
                    <p>
                      {c.suburb}
                      {c.suburb && c.state ? ", " : ""}
                      {c.state}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
