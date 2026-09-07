export type TradeType =
  | "plumbing"
  | "electrical"
  | "hvac"
  | "building"
  | "carpentry"
  | "other";

export type JobStatus = "new" | "scheduled" | "in_progress" | "completed" | "cancelled";

export type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  abn: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  trade: TradeType;
  gst_registered: boolean;
  prices_include_gst: boolean;
  default_labour_rate: number;
  default_callout_fee: number;
  default_quote_valid_days: number;
  default_payment_terms_days: number;
  quote_prefix: string;
  invoice_prefix: string;
  next_quote_seq: number;
  next_invoice_seq: number;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  first_name: string;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
