"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/quotes", label: "Quotes" },
  { href: "/customers", label: "Customers" },
  { href: "/invoices", label: "Invoices" },
  { href: "/settings", label: "Settings" },
];

export function DesktopNav({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-6 sm:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          T
        </div>
        <span className="truncate text-sm font-semibold text-ink-900">{businessName}</span>
      </div>

      <Link href="/quotes/new" className="mb-6">
        <Button className="w-full">+ Create Quote</Button>
      </Link>

      <nav className="flex-1">
        <ul className="space-y-1">
          {ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2 text-sm font-medium",
                    active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/auth/signout" method="post">
        <button type="submit" className="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-500 hover:bg-ink-50">
          Log out
        </button>
      </form>
    </aside>
  );
}
