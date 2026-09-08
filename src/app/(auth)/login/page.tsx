"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" isLoading={pending}>
      Log in
    </Button>
  );
}

function LoginForm() {
  const [state, formAction] = useFormState(login, initialState);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  return (
    <Card>
      <h1 className="mb-1 text-xl font-semibold text-ink-900">Welcome back</h1>
      <p className="mb-6 text-sm text-ink-500">Log in to your TradieAI account.</p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="mb-1.5 text-sm text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>

        <FormMessage message={state.error} />

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New to TradieAI?{" "}
        <Link href="/signup" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
