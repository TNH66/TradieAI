import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generates the next sequential number for a business-scoped table
 * (e.g. jobs -> "J-0001"). Not perfectly race-safe under concurrent
 * inserts from the same business - acceptable for V1 given the low
 * likelihood of two simultaneous creates for the same tradie, and the
 * unique (business_id, job_number) constraint means a collision fails
 * loudly rather than silently overwriting data.
 */
export async function generateSequentialNumber(
  supabase: SupabaseClient,
  table: "jobs",
  column: "job_number",
  businessId: string,
  prefix: string
): Promise<string> {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
