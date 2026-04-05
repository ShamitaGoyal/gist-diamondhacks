import { getDocument } from "pdfjs-dist";
import { configurePdfWorker } from "./pdfWorker";

function resolveUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return new URL(url, window.location.origin).href;
}

/** Full document text for Chat / Architecture APIs (page markers preserved). */
export async function extractFullTextFromPdf(url: string): Promise<{ text: string; numPages: number }> {
  configurePdfWorker();
  const task = getDocument({ url: resolveUrl(url) });
  const pdf = await task.promise;
  const numPages = pdf.numPages;
  const chunks: string[] = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    chunks.push(`--- Page ${p} ---\n${line}`);
  }

  return { text: chunks.join("\n\n"), numPages };
}
