// Spec section 15: "Never allow AI-generated assumptions to silently become
// final financial information." This module is the checkpoint - Claude's raw
// text response gets parsed and validated here, and anything that doesn't fit
// the expected shape is rejected rather than passed through.

export interface GeneratedQuoteItem {
  description: string;
  quantity: number;
  /** null means the AI could not determine a price and did not invent one -
   * the user must fill it in before the quote can be saved. */
  unit_price: number | null;
}

export interface GeneratedQuote {
  job_title: string;
  summary: string;
  items: GeneratedQuoteItem[];
  notes: string;
  /** Human-readable notes about what was assumed or left blank, shown to the
   * user so nothing becomes final without their eyes on it. */
  assumptions: string[];
}

export type ValidationResult =
  | { ok: true; data: GeneratedQuote }
  | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates the parsed JSON from Claude against the expected shape.
 * Deliberately strict: missing/malformed fields fail the whole response
 * rather than being silently defaulted into something that looks plausible.
 */
export function validateGeneratedQuote(raw: unknown): ValidationResult {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "AI response was not a JSON object." };
  }

  const jobTitle = raw.job_title;
  const summary = raw.summary;
  const notes = raw.notes;
  const assumptions = raw.assumptions;
  const items = raw.items;

  if (typeof jobTitle !== "string" || !jobTitle.trim()) {
    return { ok: false, error: "AI response was missing a job title." };
  }
  if (typeof summary !== "string") {
    return { ok: false, error: "AI response was missing a summary." };
  }
  if (typeof notes !== "string") {
    return { ok: false, error: "AI response was missing notes." };
  }
  if (!Array.isArray(assumptions) || !assumptions.every((a) => typeof a === "string")) {
    return { ok: false, error: "AI response had an invalid assumptions list." };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "AI response did not include any line items." };
  }

  const cleanItems: GeneratedQuoteItem[] = [];

  for (const rawItem of items) {
    if (!isPlainObject(rawItem)) {
      return { ok: false, error: "AI response contained a malformed line item." };
    }

    const description = rawItem.description;
    const quantity = rawItem.quantity;
    const unitPrice = rawItem.unit_price;

    if (typeof description !== "string" || !description.trim()) {
      return { ok: false, error: "A line item was missing a description." };
    }
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, error: `Line item "${description}" had an invalid quantity.` };
    }

    let cleanUnitPrice: number | null = null;
    if (unitPrice !== null && unitPrice !== undefined) {
      if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice < 0) {
        return { ok: false, error: `Line item "${description}" had an invalid price.` };
      }
      cleanUnitPrice = unitPrice;
    }

    cleanItems.push({ description: description.trim(), quantity, unit_price: cleanUnitPrice });
  }

  return {
    ok: true,
    data: {
      job_title: jobTitle.trim(),
      summary: summary.trim(),
      items: cleanItems,
      notes: notes.trim(),
      assumptions: assumptions.map((a) => a.trim()).filter(Boolean),
    },
  };
}

/** Strips markdown code fences in case the model wraps its JSON despite instructions. */
export function extractJsonFromText(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fenced ? fenced[1] : trimmed;
  return JSON.parse(jsonText);
}
