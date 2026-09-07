import { rgb, type PDFFont } from "pdf-lib";

export const PAGE_WIDTH = 595.28; // A4 at 72dpi
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 50;

export const COLORS = {
  ink: rgb(0.11, 0.13, 0.16), // ink-900
  muted: rgb(0.4, 0.44, 0.55), // ink-500
  brand: rgb(0.11, 0.44, 0.94), // brand-600
  line: rgb(0.85, 0.86, 0.89), // ink-200
};

export function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/** Wraps text to fit a max width for a given font/size, splitting on spaces. */
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(attempt, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export function addressLines(entity: {
  address?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
}): string[] {
  const lines: string[] = [];
  if (entity.address) lines.push(entity.address);
  const cityLine = [entity.suburb, entity.state, entity.postcode].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  return lines;
}
