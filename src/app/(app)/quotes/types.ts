import type { QuoteStatus } from "@/lib/types";

export interface Quote {
  id: string;
  business_id: string;
  customer_id: string | null;
  job_id: string | null;
  quote_number: string;
  status: QuoteStatus;
  title: string | null;
  description: string | null;
  subtotal: number;
  gst: number;
  total: number;
  valid_until: string | null;
  notes: string | null;
  public_id: string;
  ai_assumptions: string[] | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
  sort_order: number;
}
