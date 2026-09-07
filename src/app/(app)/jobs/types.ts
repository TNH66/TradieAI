import type { JobStatus } from "@/lib/types";

export interface Job {
  id: string;
  business_id: string;
  customer_id: string | null;
  job_number: string;
  title: string;
  description: string | null;
  status: JobStatus;
  scheduled_at: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
