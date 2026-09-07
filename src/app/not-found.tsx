import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-2xl">
        🔍
      </div>
      <h1 className="mb-2 text-lg font-semibold text-ink-900">Page not found</h1>
      <p className="mb-6 max-w-sm text-sm text-ink-500">
        That page doesn't exist, or you may not have access to it.
      </p>
      <Link href="/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  );
}
