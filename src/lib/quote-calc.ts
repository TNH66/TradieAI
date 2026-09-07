// Quote calculations must be deterministic and decimal-safe (spec section 32:
// "Do NOT rely on Claude for arithmetic"). This module is imported by both the
// server (authoritative save) and the client (live preview while editing) -
// keep it free of any server-only imports.

/** Standard Australian GST rate. Not user-configurable in V1 - businesses only
 * choose whether they're registered and whether their prices already include it. */
export const GST_RATE = 0.1;

/** Rounds to 2 decimal places using standard "round half up" semantics,
 * avoiding the float drift that comes from repeated multiplication/division. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface QuoteLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteLineComputed extends QuoteLineInput {
  lineAmount: number; // quantity * unitPrice, rounded
}

export interface QuoteTotals {
  lines: QuoteLineComputed[];
  subtotal: number; // ex-GST
  gst: number;
  total: number; // inc-GST
  taxRate: number; // the rate applied, as a percentage (e.g. 10)
}

/**
 * Computes line amounts and quote-level GST/subtotal/total.
 *
 * - If the business isn't GST-registered, no GST is added regardless of the
 *   pricesIncludeGst flag.
 * - If GST-registered and prices are entered GST-exclusive (the common case,
 *   and what the spec's worked example uses): subtotal = sum of line
 *   amounts, GST = subtotal * rate, total = subtotal + GST.
 * - If GST-registered and prices are entered GST-inclusive: the line amounts
 *   already include GST, so we back it out: total = sum of line amounts,
 *   subtotal = total / (1 + rate), GST = total - subtotal.
 */
export function calculateQuoteTotals(
  items: QuoteLineInput[],
  gstRegistered: boolean,
  pricesIncludeGst: boolean
): QuoteTotals {
  const lines: QuoteLineComputed[] = items.map((item) => ({
    ...item,
    lineAmount: round2(item.quantity * item.unitPrice),
  }));

  const sumAmounts = round2(lines.reduce((sum, l) => sum + l.lineAmount, 0));

  if (!gstRegistered) {
    return { lines, subtotal: sumAmounts, gst: 0, total: sumAmounts, taxRate: 0 };
  }

  if (pricesIncludeGst) {
    const total = sumAmounts;
    const subtotal = round2(total / (1 + GST_RATE));
    const gst = round2(total - subtotal);
    return { lines, subtotal, gst, total, taxRate: GST_RATE * 100 };
  }

  const subtotal = sumAmounts;
  const gst = round2(subtotal * GST_RATE);
  const total = round2(subtotal + gst);
  return { lines, subtotal, gst, total, taxRate: GST_RATE * 100 };
}
