"use client";

import { useTransition } from "react";
import { updateQuoteStatus } from "../actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import type { QuoteStatus } from "@/lib/types";

const STATUSES: QuoteStatus[] = ["draft", "sent", "viewed", "accepted", "declined", "expired"];

export function QuoteStatusActions({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <Button
          isLoading={isPending}
          onClick={() => startTransition(() => updateQuoteStatus(quoteId, "sent"))}
        >
          Send Quote
        </Button>
      )}

      <Select
        aria-label="Update status"
        value={status}
        disabled={isPending}
        onChange={(e) => startTransition(() => updateQuoteStatus(quoteId, e.target.value as QuoteStatus))}
        className="h-11 w-auto"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </Select>
    </div>
  );
}
