"use client";

import { useFormState } from "react-dom";
import { updateQuote, type QuoteFormState } from "../../actions";
import { QuoteForm } from "../../quote-form";
import type { Quote, QuoteItem } from "../../types";

const initialState: QuoteFormState = {};

export function EditQuoteForm({
  quote,
  items,
  customers,
  jobs,
  business,
}: {
  quote: Quote;
  items: QuoteItem[];
  customers: { id: string; first_name: string; last_name: string | null }[];
  jobs: { id: string; title: string; job_number: string }[];
  business: { gst_registered: boolean; prices_include_gst: boolean; default_quote_valid_days: number };
}) {
  const boundUpdate = updateQuote.bind(null, quote.id);
  const [state, formAction] = useFormState(boundUpdate, initialState);

  return (
    <QuoteForm
      formAction={formAction}
      state={state}
      customers={customers}
      jobs={jobs}
      business={business}
      defaultQuote={quote}
      defaultItems={items}
      submitLabel="Save Changes"
    />
  );
}
