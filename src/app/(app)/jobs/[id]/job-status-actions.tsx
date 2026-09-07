"use client";

import { useTransition } from "react";
import { updateJobStatus } from "../actions";
import { Button } from "@/components/ui/button";
import type { JobStatus } from "@/lib/types";

export function JobStatusActions({ jobId, status }: { jobId: string; status: JobStatus }) {
  const [isPending, startTransition] = useTransition();

  if (status === "completed" || status === "cancelled") {
    return null;
  }

  return (
    <Button
      variant="secondary"
      isLoading={isPending}
      onClick={() => startTransition(() => updateJobStatus(jobId, "completed"))}
    >
      Mark Complete
    </Button>
  );
}
