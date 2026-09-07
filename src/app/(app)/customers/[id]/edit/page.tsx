import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditCustomerForm } from "./edit-customer-form";
import type { Customer } from "@/lib/types";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Edit Customer</h1>
      <EditCustomerForm customer={customer as Customer} />
    </div>
  );
}
