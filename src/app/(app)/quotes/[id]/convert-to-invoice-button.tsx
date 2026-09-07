"use client";

import { useFormState, useFormStatus } from "react-dom";
import { convertQuoteToInvoice, type ConvertToInvoiceState } from "../../invoices/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

const initialState: ConvertToInvoiceState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button isLoading={pending} type="submit">
      Convert to Invoice
    </Button>
  );
}

export function ConvertToInvoiceButton({ quoteId }: { quoteId: string }) {
  const boundConvert = convertQuoteToInvoice.bind(null, quoteId);
  const [state, formAction] = useFormState(boundConvert, initialState);

  return (
    <form action={formAction}>
      <SubmitButton />
      <FormMessage message={state.error} />
    </form>
  );
}
