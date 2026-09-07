import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PAGE_WIDTH, PAGE_HEIGHT, MARGIN, COLORS, money, formatDate, wrapText, addressLines } from "./shared";

export interface InvoicePdfData {
  business: {
    name: string;
    abn: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    suburb: string | null;
    state: string | null;
    postcode: string | null;
    default_payment_terms_days: number;
    logo_url: string | null;
  };
  invoice: {
    invoice_number: string;
    status: string;
    subtotal: number;
    gst: number;
    total: number;
    due_date: string | null;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
  };
  customer: {
    first_name: string;
    last_name: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    suburb: string | null;
    state: string | null;
    postcode: string | null;
  } | null;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

const INK = COLORS.ink;
const MUTED = COLORS.muted;
const BRAND = COLORS.brand;
const LINE = COLORS.line;

function customerName(customer: InvoicePdfData["customer"]): string {
  if (!customer) return "—";
  return [customer.first_name, customer.last_name].filter(Boolean).join(" ");
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Invoice ${data.invoice.invoice_number}`);
  pdfDoc.setProducer("TradieAI");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPageIfNeeded(spaceNeeded: number) {
    if (y - spaceNeeded < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function text(
    content: string,
    x: number,
    options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; align?: "left" | "right" } = {}
  ) {
    const size = options.size ?? 10;
    const usedFont = options.bold ? fontBold : font;
    const color = options.color ?? INK;
    let drawX = x;
    if (options.align === "right") {
      drawX = x - usedFont.widthOfTextAtSize(content, size);
    }
    page.drawText(content, { x: drawX, y, size, font: usedFont, color });
  }

  function hline(color = LINE) {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 1,
      color,
    });
  }

  // --- Header ---
  text(data.business.name, MARGIN, { size: 16, bold: true });
  const headerLabel = data.invoice.status === "paid" ? "PAID" : "INVOICE";
  text(headerLabel, PAGE_WIDTH - MARGIN, {
    size: 20,
    bold: true,
    color: data.invoice.status === "paid" ? rgb(0.13, 0.55, 0.13) : BRAND,
    align: "right",
  });
  y -= 20;

  const businessLines = [
    ...addressLines(data.business),
    data.business.abn ? `ABN ${data.business.abn}` : null,
    data.business.phone,
    data.business.email,
  ].filter(Boolean) as string[];

  const rightMeta = [
    data.invoice.invoice_number,
    `Date: ${formatDate(data.invoice.created_at)}`,
    `Due: ${formatDate(data.invoice.due_date)}`,
  ];

  const blockTop = y;
  for (const line of businessLines) {
    text(line, MARGIN, { size: 9.5, color: MUTED });
    y -= 13;
  }
  const afterBusiness = y;

  y = blockTop;
  for (const line of rightMeta) {
    text(line, PAGE_WIDTH - MARGIN, { size: 9.5, color: MUTED, align: "right" });
    y -= 13;
  }
  const afterMeta = y;

  y = Math.min(afterBusiness, afterMeta) - 10;
  hline();
  y -= 24;

  // --- Bill to ---
  text("BILL TO", MARGIN, { size: 8.5, bold: true, color: MUTED });
  y -= 14;
  text(customerName(data.customer), MARGIN, { size: 11, bold: true });
  y -= 14;
  if (data.customer?.company) {
    text(data.customer.company, MARGIN, { size: 9.5, color: MUTED });
    y -= 13;
  }
  for (const line of addressLines(data.customer ?? {})) {
    text(line, MARGIN, { size: 9.5, color: MUTED });
    y -= 13;
  }
  if (data.customer?.email) {
    text(data.customer.email, MARGIN, { size: 9.5, color: MUTED });
    y -= 13;
  }

  y -= 16;
  hline();
  y -= 22;

  // --- Line items ---
  const colDesc = MARGIN;
  const colQty = PAGE_WIDTH - MARGIN - 210;
  const colPrice = PAGE_WIDTH - MARGIN - 130;
  const colTotal = PAGE_WIDTH - MARGIN;

  text("DESCRIPTION", colDesc, { size: 8.5, bold: true, color: MUTED });
  text("QTY", colQty, { size: 8.5, bold: true, color: MUTED });
  text("UNIT PRICE", colPrice, { size: 8.5, bold: true, color: MUTED, align: "right" });
  text("TOTAL", colTotal, { size: 8.5, bold: true, color: MUTED, align: "right" });
  y -= 10;
  hline();
  y -= 18;

  const descMaxWidth = colQty - colDesc - 16;

  for (const item of data.items) {
    const descLines = wrapText(item.description, font, 10, descMaxWidth);
    const rowHeight = descLines.length * 13 + 8;
    newPageIfNeeded(rowHeight);

    const rowTop = y;
    for (const line of descLines) {
      text(line, colDesc, { size: 10 });
      y -= 13;
    }
    y = rowTop;
    text(String(item.quantity), colQty, { size: 10 });
    text(money(item.unit_price), colPrice, { size: 10, align: "right" });
    text(money(item.total), colTotal, { size: 10, align: "right" });
    y = rowTop - rowHeight;
  }

  hline();
  y -= 20;

  // --- Totals ---
  newPageIfNeeded(90);
  const totalsLabelX = colPrice;
  text("Subtotal", totalsLabelX, { size: 10, color: MUTED, align: "right" });
  text(money(data.invoice.subtotal), colTotal, { size: 10, align: "right" });
  y -= 16;
  text("GST", totalsLabelX, { size: 10, color: MUTED, align: "right" });
  text(money(data.invoice.gst), colTotal, { size: 10, align: "right" });
  y -= 6;
  page.drawLine({
    start: { x: totalsLabelX - 60, y },
    end: { x: colTotal, y },
    thickness: 1,
    color: LINE,
  });
  y -= 16;
  text(data.invoice.status === "paid" ? "TOTAL PAID" : "TOTAL DUE", totalsLabelX, {
    size: 12,
    bold: true,
    align: "right",
  });
  text(money(data.invoice.total), colTotal, { size: 12, bold: true, align: "right" });
  y -= 30;

  // --- Notes ---
  if (data.invoice.notes) {
    newPageIfNeeded(60);
    text("NOTES", MARGIN, { size: 8.5, bold: true, color: MUTED });
    y -= 14;
    const noteLines = wrapText(data.invoice.notes, font, 10, PAGE_WIDTH - MARGIN * 2);
    for (const line of noteLines) {
      newPageIfNeeded(14);
      text(line, MARGIN, { size: 10 });
      y -= 13;
    }
    y -= 16;
  }

  // --- Footer ---
  newPageIfNeeded(40);
  hline();
  y -= 16;
  text(
    data.invoice.status === "paid"
      ? "This invoice has been paid in full. Thank you for your business."
      : `Payment due within ${data.business.default_payment_terms_days} days of the invoice date.`,
    MARGIN,
    { size: 8.5, color: MUTED }
  );

  return pdfDoc.save();
}
