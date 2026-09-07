"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { calculateQuoteTotals, type QuoteLineInput } from "@/lib/quote-calc";
import { formatCurrency } from "@/lib/format";
import type { Quote, QuoteItem } from "./types";
import type { QuoteFormState } from "./actions";

function SubmitButton({ label, blocked }: { label: string; blocked?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" isLoading={pending} disabled={blocked}>
      {label}
    </Button>
  );
}

interface LineRow {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

let rowKeySeq = 0;
function newRow(defaults?: Partial<LineRow>): LineRow {
  rowKeySeq += 1;
  return {
    key: `row-${rowKeySeq}`,
    description: defaults?.description ?? "",
    quantity: defaults?.quantity ?? "1",
    unitPrice: defaults?.unitPrice ?? "",
  };
}

export function QuoteForm({
  formAction,
  state,
  customers,
  jobs,
  business,
  defaultQuote,
  defaultItems,
  initialLines,
  assumptions,
  defaultCustomerId,
  defaultJobId,
  initialTitle,
  initialNotes,
  submitLabel,
}: {
  formAction: (formData: FormData) => void;
  state: QuoteFormState;
  customers: { id: string; first_name: string; last_name: string | null }[];
  jobs: { id: string; title: string; job_number: string }[];
  business: { gst_registered: boolean; prices_include_gst: boolean; default_quote_valid_days: number };
  defaultQuote?: Partial<Quote>;
  defaultItems?: QuoteItem[];
  /** Pre-fill from AI generation - takes priority over defaultItems. unitPrice
   * of null means the AI deliberately left it blank for the user to fill in. */
  initialLines?: { description: string; quantity: number; unitPrice: number | null }[];
  assumptions?: string[];
  defaultCustomerId?: string;
  defaultJobId?: string;
  initialTitle?: string;
  initialNotes?: string;
  submitLabel: string;
}) {
  const [rows, setRows] = useState<LineRow[]>(() => {
    if (initialLines && initialLines.length > 0) {
      return initialLines.map((item) =>
        newRow({
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: item.unitPrice === null ? "" : String(item.unitPrice),
        })
      );
    }
    if (defaultItems && defaultItems.length > 0) {
      return defaultItems
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) =>
          newRow({
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unit_price),
          })
        );
    }
    return [newRow()];
  });

  const defaultValidUntil =
    defaultQuote?.valid_until ??
    new Date(Date.now() + business.default_quote_valid_days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

  const lineInputs: QuoteLineInput[] = useMemo(
    () =>
      rows
        .filter((r) => r.description.trim() && Number(r.quantity) > 0)
        .map((r) => ({
          description: r.description,
          quantity: Number(r.quantity) || 0,
          unitPrice: Number(r.unitPrice) || 0,
        })),
    [rows]
  );

  const totals = useMemo(
    () => calculateQuoteTotals(lineInputs, business.gst_registered, business.prices_include_gst),
    [lineInputs, business.gst_registered, business.prices_include_gst]
  );

  const missingPriceDescriptions = rows
    .filter((r) => r.description.trim() && r.unitPrice.trim() === "")
    .map((r) => r.description.trim());

  function updateRow(key: string, patch: Partial<LineRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  const itemsJson = JSON.stringify(
    rows
      .filter((r) => r.description.trim() && Number(r.quantity) > 0)
      .map((r) => ({
        description: r.description,
        quantity: Number(r.quantity) || 0,
        unitPrice: Number(r.unitPrice) || 0,
      }))
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="itemsJson" value={itemsJson} />

      {assumptions && assumptions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-medium text-amber-800">
            The AI made some assumptions - please review before saving:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink-900">Job</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="customerId">Customer</Label>
            <Select
              id="customerId"
              name="customerId"
              defaultValue={defaultQuote?.customer_id ?? defaultCustomerId ?? ""}
            >
              <option value="">No customer selected</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name ?? ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="jobId">Linked job (optional)</Label>
            <Select id="jobId" name="jobId" defaultValue={defaultQuote?.job_id ?? defaultJobId ?? ""}>
              <option value="">No linked job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_number} - {j.title}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="title">Job title / summary</Label>
          <Input
            id="title"
            name="title"
            defaultValue={defaultQuote?.title ?? initialTitle ?? ""}
            placeholder="e.g. Tempering valve replacement"
          />
        </div>
        <div className="mt-4">
          <Label htmlFor="validUntil">Valid until</Label>
          <Input id="validUntil" name="validUntil" type="date" defaultValue={defaultValidUntil} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink-900">Line items</h2>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  aria-label="Description"
                  placeholder="Description (e.g. Call-out)"
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                />
              </div>
              <div className="w-16">
                <Input
                  aria-label="Quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                />
              </div>
              <div className="w-24">
                <Input
                  aria-label="Unit price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="$"
                  value={row.unitPrice}
                  onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
                  className={row.description.trim() && row.unitPrice.trim() === "" ? "border-amber-400" : undefined}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl text-ink-400 hover:bg-ink-100 hover:text-red-600"
                aria-label="Remove line item"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-3 text-sm font-medium text-brand-700 hover:underline"
        >
          + Add line item
        </button>

        <div className="mt-5 space-y-1 border-t border-ink-100 pt-4 text-sm">
          <div className="flex justify-between text-ink-500">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>GST {business.gst_registered ? `(${totals.taxRate}%)` : "(not registered)"}</span>
            <span>{formatCurrency(totals.gst)}</span>
          </div>
          <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink-900">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <Label htmlFor="notes">Notes for the customer</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultQuote?.notes ?? initialNotes ?? ""}
          placeholder="e.g. Replace existing tempering valve and test system."
          className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-base text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </Card>

      <div className="sticky bottom-16 -mx-4 border-t border-ink-100 bg-ink-50/95 px-4 pb-3 pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:bottom-0 sm:p-0">
        <FormMessage message={state.error} />

        {missingPriceDescriptions.length > 0 && (
          <FormMessage
            message={`Enter a price for: ${missingPriceDescriptions.join(", ")} before saving.`}
          />
        )}

        <SubmitButton label={submitLabel} blocked={missingPriceDescriptions.length > 0} />
      </div>
    </form>
  );
}
