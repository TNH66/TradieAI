"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";

const initialState: ForgotPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" isLoading={pending}>
      Send reset link
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  return (
    <Card>
      <h1 className="mb-1 text-xl font-semibold text-ink-900">Reset your password</h1>
      <p className="mb-6 text-sm text-ink-500">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {state.success ? (
        <FormMessage type="success" message={state.success} />
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <FormMessage message={state.error} />
          <SubmitButton />
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Back to log in
        </Link>
      </p>
    </Card>
  );
}
