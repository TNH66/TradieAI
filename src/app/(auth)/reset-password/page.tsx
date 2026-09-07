"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { updatePassword, type ResetPasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";

const initialState: ResetPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" isLoading={pending}>
      Update password
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(updatePassword, initialState);

  return (
    <Card>
      <h1 className="mb-1 text-xl font-semibold text-ink-900">Choose a new password</h1>
      <p className="mb-6 text-sm text-ink-500">Enter a new password for your account.</p>

      {state.success ? (
        <>
          <FormMessage type="success" message="Your password has been updated." />
          <Link href="/login" className="mt-4 block">
            <Button size="lg" className="w-full">
              Continue to log in
            </Button>
          </Link>
        </>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
          </div>
          <FormMessage message={state.error} />
          <SubmitButton />
        </form>
      )}
    </Card>
  );
}
