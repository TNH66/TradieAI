"use client";

import { useTransition } from "react";
import { updateInvoiceStatus } from "../actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import type { InvoiceStatus } from "@/lib/types";

const STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "cancelled"];

export function InvoiceStatusActions({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "paid" && status !== "cancelled" && (
        <Button
          isLoading={isPending}
          onClick={() => startTransition(() => updateInvoiceStatus(invoiceId, "paid"))}
        >
          Mark as Paid
        </Button>
      )}
      {status === "draft" && (
        <Button
          variant="secondary"
          isLoading={isPending}
          onClick={() => startTransition(() => updateInvoiceStatus(invoiceId, "sent"))}
        >
          Mark as Sent
        </Button>
      )}

      <Select
        aria-label="Update status"
        value={status}
        disabled={isPending}
        onChange={(e) => startTransition(() => updateInvoiceStatus(invoiceId, e.target.value as InvoiceStatus))}
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
