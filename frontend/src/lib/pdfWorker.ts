import { GlobalWorkerOptions } from "pdfjs-dist";

let configured = false;

/**
 * Same worker as `public/pdf.worker.mjs` (must match `main.tsx` + react-pdf).
 * `getDocument` in extractPdfText runs before/without PdfReaderPane; ensure worker is set.
 */
export function configurePdfWorker(): void {
  if (typeof window === "undefined" || configured) return;
  GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.mjs`;
  configured = true;
}
