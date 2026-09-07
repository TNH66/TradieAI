import type { InvoiceStatus } from "@/lib/types";

export interface Invoice {
  id: string;
  business_id: string;
  customer_id: string | null;
  job_id: string | null;
  quote_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  gst: number;
  total: number;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
  sort_order: number;
}
