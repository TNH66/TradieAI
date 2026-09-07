import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If this user already has a business, onboarding is done - don't let them
  // create a second one by revisiting this URL.
  const { data: existingBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingBusiness) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
            T
          </div>
          <h1 className="text-2xl font-semibold text-ink-900">Set up your business</h1>
          <p className="mt-1 text-sm text-ink-500">
            This takes about a minute and shapes how your quotes look and calculate.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
