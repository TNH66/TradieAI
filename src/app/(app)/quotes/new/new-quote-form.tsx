"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createQuote, type QuoteFormState } from "../actions";
import { QuoteForm } from "../quote-form";
import { AiQuoteInput } from "./ai-quote-input";
import type { GeneratedQuote } from "@/lib/ai/quote-schema";

const initialState: QuoteFormState = {};

export function NewQuoteForm({
  customers,
  jobs,
  business,
  defaultCustomerId,
  defaultJobId,
}: {
  customers: { id: string; first_name: string; last_name: string | null }[];
  jobs: { id: string; title: string; job_number: string }[];
  business: { gst_registered: boolean; prices_include_gst: boolean; default_quote_valid_days: number };
  defaultCustomerId?: string;
  defaultJobId?: string;
}) {
  const [state, formAction] = useFormState(createQuote, initialState);
  const [mode, setMode] = useState<"choose" | "manual">("choose");
  const [generated, setGenerated] = useState<GeneratedQuote | null>(null);

  const showEditor = mode === "manual" || generated !== null;

  if (!showEditor) {
    return (
      <div className="space-y-4">
        <AiQuoteInput onGenerated={setGenerated} />
        <button
          type="button"
          onClick={() => setMode("manual")}
          className="mx-auto block text-sm font-medium text-ink-500 hover:text-ink-700 hover:underline"
        >
          Skip - enter the quote manually instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {generated && (
        <button
          type="button"
          onClick={() => setGenerated(null)}
          className="text-sm font-medium text-ink-500 hover:text-ink-700 hover:underline"
        >
          ← Start over
        </button>
      )}
      <QuoteForm
        formAction={formAction}
        state={state}
        customers={customers}
        jobs={jobs}
        business={business}
        defaultCustomerId={defaultCustomerId}
        defaultJobId={defaultJobId}
        initialLines={generated?.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        }))}
        initialTitle={generated?.job_title}
        initialNotes={generated?.notes}
        assumptions={generated?.assumptions}
        submitLabel="Save Quote"
      />
    </div>
  );
}
