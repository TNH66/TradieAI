"use client";

import { useFormState } from "react-dom";
import { createJob, type JobFormState } from "../actions";
import { JobForm } from "../job-form";

const initialState: JobFormState = {};

export function NewJobForm({
  customers,
  defaultCustomerId,
}: {
  customers: { id: string; first_name: string; last_name: string | null }[];
  defaultCustomerId?: string;
}) {
  const [state, formAction] = useFormState(createJob, initialState);

  return (
    <JobForm
      formAction={formAction}
      state={state}
      customers={customers}
      defaultCustomerId={defaultCustomerId}
      submitLabel="Save Job"
    />
  );
}
