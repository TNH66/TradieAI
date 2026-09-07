import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DesktopNav } from "@/components/nav/desktop-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <DesktopNav businessName={business.name} />

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 sm:hidden">
          <span className="text-sm font-semibold text-ink-900">{business.name}</span>
          <Link href="/quotes/new">
            <Button size="md">+ Create Quote</Button>
          </Link>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-8 sm:py-8 sm:pb-8">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}
