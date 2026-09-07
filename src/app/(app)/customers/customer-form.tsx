"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { AUSTRALIAN_STATES, type Customer } from "@/lib/types";
import type { CustomerFormState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" isLoading={pending}>
      {label}
    </Button>
  );
}

export function CustomerForm({
  formAction,
  state,
  defaultValues,
  submitLabel,
}: {
  formAction: (formData: FormData) => void;
  state: CustomerFormState;
  defaultValues?: Partial<Customer>;
  submitLabel: string;
}) {
  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" defaultValue={defaultValues?.first_name} required />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" defaultValue={defaultValues?.last_name ?? ""} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="company">Company (optional)</Label>
          <Input id="company" name="company" defaultValue={defaultValues?.company ?? ""} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={defaultValues?.phone ?? ""} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="address">Street address</Label>
          <Input id="address" name="address" defaultValue={defaultValues?.address ?? ""} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Label htmlFor="suburb">Suburb</Label>
            <Input id="suburb" name="suburb" defaultValue={defaultValues?.suburb ?? ""} />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Select id="state" name="state" defaultValue={defaultValues?.state ?? ""}>
              <option value="">—</option>
              {AUSTRALIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              name="postcode"
              inputMode="numeric"
              maxLength={4}
              defaultValue={defaultValues?.postcode ?? ""}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={defaultValues?.notes ?? ""}
            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-base text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </Card>

      <FormMessage message={state.error} />

      <SubmitButton label={submitLabel} />
    </form>
  );
}
