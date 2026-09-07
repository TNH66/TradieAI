"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { acceptQuote, declineQuote, type QuoteResponseState } from "./actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

const initialState: QuoteResponseState = {};

function ActionButton({ label, variant }: { label: string; variant: "primary" | "secondary" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" variant={variant} className="flex-1" isLoading={pending}>
      {label}
    </Button>
  );
}

export function QuoteResponseActions({ publicId }: { publicId: string }) {
  const boundAccept = acceptQuote.bind(null, publicId);
  const boundDecline = declineQuote.bind(null, publicId);
  const [acceptState, acceptFormAction] = useFormState(boundAccept, initialState);
  const [declineState, declineFormAction] = useFormState(boundDecline, initialState);
  const [confirmingDecline, setConfirmingDecline] = useState(false);

  if (confirmingDecline) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-700">Are you sure you want to decline this quote?</p>
        <div className="flex gap-3">
          <form action={declineFormAction} className="flex-1">
            <ActionButton label="Yes, decline" variant="secondary" />
          </form>
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmingDecline(false)}>
            Go back
          </Button>
        </div>
        <FormMessage message={declineState.error} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <form action={acceptFormAction} className="flex-1">
          <ActionButton label="Accept Quote" variant="primary" />
        </form>
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="flex-1"
          onClick={() => setConfirmingDecline(true)}
        >
          Decline Quote
        </Button>
      </div>
      <FormMessage message={acceptState.error} />
    </div>
  );
}
