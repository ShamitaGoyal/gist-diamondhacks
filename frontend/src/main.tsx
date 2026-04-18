import { createRoot } from "react-dom/client";
import { pdfjs } from "react-pdf";
import App from "./App.tsx";
import "./index.css";

// react-pdf defaults to `pdf.worker.mjs` (relative) → Vite serves index.html. Use bundled worker from /public.
pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.mjs`;

createRoot(document.getElementById("root")!).render(<App />);
