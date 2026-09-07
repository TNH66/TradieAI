import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Settings</h1>
      <Card>
        <h2 className="mb-3 text-base font-semibold text-ink-900">Business profile</h2>
        <p className="mb-4 text-sm text-ink-500">
          Editing these fields is coming soon - for now this confirms what was saved during
          onboarding.
        </p>
        {business ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Field label="Business name" value={business.name} />
            <Field label="ABN" value={business.abn} />
            <Field label="Phone" value={business.phone} />
            <Field label="Email" value={business.email} />
            <Field label="Address" value={business.address} />
            <Field label="Suburb" value={business.suburb} />
            <Field label="State" value={business.state} />
            <Field label="Postcode" value={business.postcode} />
            <Field label="Trade" value={business.trade} />
            <Field label="GST registered" value={business.gst_registered ? "Yes" : "No"} />
            <Field
              label="Prices"
              value={business.prices_include_gst ? "GST inclusive" : "GST exclusive"}
            />
            <Field label="Default labour rate" value={`$${business.default_labour_rate}/hr`} />
            <Field label="Default call-out fee" value={`$${business.default_callout_fee}`} />
            <Field label="Quote validity" value={`${business.default_quote_valid_days} days`} />
            <Field label="Payment terms" value={`${business.default_payment_terms_days} days`} />
          </dl>
        ) : (
          <p className="text-sm text-ink-500">No business profile found.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-ink-900">Account</h2>
        <p className="mb-4 text-sm text-ink-500">{user?.email}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Log out
          </button>
        </form>
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
