"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import type { Job } from "./types";
import type { JobFormState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" isLoading={pending}>
      {label}
    </Button>
  );
}

export function JobForm({
  formAction,
  state,
  customers,
  defaultValues,
  defaultCustomerId,
  submitLabel,
}: {
  formAction: (formData: FormData) => void;
  state: JobFormState;
  customers: { id: string; first_name: string; last_name: string | null }[];
  defaultValues?: Partial<Job>;
  defaultCustomerId?: string;
  submitLabel: string;
}) {
  const scheduledDate = defaultValues?.scheduled_at
    ? defaultValues.scheduled_at.slice(0, 10)
    : "";
  const scheduledTime = defaultValues?.scheduled_at
    ? defaultValues.scheduled_at.slice(11, 16)
    : "";

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <div>
          <Label htmlFor="title">Job title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={defaultValues?.title}
            placeholder="e.g. Hot water replacement"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="customerId">Customer</Label>
          <Select
            id="customerId"
            name="customerId"
            defaultValue={defaultValues?.customer_id ?? defaultCustomerId ?? ""}
          >
            <option value="">No customer selected</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name ?? ""}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="scheduledDate">Scheduled date</Label>
            <Input id="scheduledDate" name="scheduledDate" type="date" defaultValue={scheduledDate} />
          </div>
          <div>
            <Label htmlFor="scheduledTime">Scheduled time</Label>
            <Input id="scheduledTime" name="scheduledTime" type="time" defaultValue={scheduledTime} />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaultValues?.description ?? ""}
            placeholder="What needs to happen on this job?"
            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-base text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
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
