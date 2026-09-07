"use client";

import { useFormState } from "react-dom";
import { updateJob, type JobFormState } from "../../actions";
import { JobForm } from "../../job-form";
import type { Job } from "../../types";

const initialState: JobFormState = {};

export function EditJobForm({
  job,
  customers,
}: {
  job: Job;
  customers: { id: string; first_name: string; last_name: string | null }[];
}) {
  const boundUpdate = updateJob.bind(null, job.id);
  const [state, formAction] = useFormState(boundUpdate, initialState);

  return (
    <JobForm
      formAction={formAction}
      state={state}
      customers={customers}
      defaultValues={job}
      submitLabel="Save Changes"
    />
  );
}
