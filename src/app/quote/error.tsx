"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function QuoteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error on public quote page:", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
        ⚠️
      </div>
      <h1 className="mb-2 text-lg font-semibold text-ink-900">Something went wrong</h1>
      <p className="mb-6 text-sm text-ink-500">
        We couldn't load this quote. Please try again, or contact the business that sent you this
        link.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
