"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/quotes", label: "Quotes" },
  { href: "/customers", label: "Customers" },
  { href: "/settings", label: "More" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 backdrop-blur sm:hidden">
      <ul className="flex">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
                  active ? "text-brand-700" : "text-ink-500"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-brand-600" : "bg-transparent")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
