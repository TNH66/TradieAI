"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the real error server/console-side only - never render error.message
    // or error.stack to the person using the app.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
        ⚠️
      </div>
      <h1 className="mb-2 text-lg font-semibold text-ink-900">Something went wrong</h1>
      <p className="mb-6 max-w-sm text-sm text-ink-500">
        We hit a snag loading this page. Please try again - if it keeps happening, get in touch
        with support.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
