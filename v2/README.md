# PDF Lens (v2) — Frontend

This folder is a **standalone React application** (“PDF Lens”) that presents a **mock PDF reader** with a side panel for **AI-powered Explain**, **Architecture**, and **Chat**. All Gemini calls go **through your FastAPI backend**; the browser never holds `GEMINI_API_KEY`.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| **Runtime / UI** | [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Build / dev server** | [Vite 5](https://vitejs.dev/) with [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) (fast refresh, SWC compile) |
| **Routing** | [React Router v6](https://reactrouter.com/) (`BrowserRouter`, `Routes`, `Route`) |
| **Server state (available)** | [TanStack Query v5](https://tanstack.com/query) — `QueryClientProvider` wraps the app (PDF Lens flows mostly use local `useState` + `fetch`) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/), [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate), [tailwind-merge](https://github.com/dcastil/tailwind-merge), [class-variance-authority](https://cva.style/docs) |
| **Components** | [Radix UI](https://www.radix-ui.com/) primitives + shadcn-style wrappers under `src/components/ui/` |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Forms / validation (available)** | [react-hook-form](https://react-hook-form.com/), [Zod](https://zod.dev/), [@hookform/resolvers](https://github.com/react-hook-form/resolvers) |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski/), shadcn Toaster |
| **Tests (available)** | [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/react), [Playwright](https://playwright.dev/) |

---

## How the app is structured

### Entry and routing

- **`src/main.tsx`** — mounts React on `#root`, imports global **`src/index.css`** (Tailwind + design tokens).
- **`src/App.tsx`** — wraps the tree with `QueryClientProvider`, `TooltipProvider`, toast containers, and `BrowserRouter`.
- **Routes**
  - **`/`** → **`src/pages/Index.tsx`** (main PDF Lens experience).
  - **`*`** → **`src/pages/NotFound.tsx`**.

### PDF Lens feature code (`src/components/pdf-lens/`)

| File / area | Role |
|-------------|------|
| **`Index.tsx`** (page) | Owns **selection**, **explanation** state, **architecture** fetch lifecycle, **chat** initial message, and wires **`PDFPane`** + **`SidePanel`**. Builds **`paperContext`** from in-app section text for Chat and Architecture. |
| **`PDFPane.tsx`** | Renders scrollable “paper” sections, built-in highlights, user text selection, floating Explain/Chat actions. |
| **`SidePanel.tsx`** | Tabs: **Explain** \| **Architecture** \| **Chat**; passes props into each tab. |
| **`ExplainTab.tsx`** | Shows quote, **visual**, plain explanation; **Simpler / More detail / Analogy** call **`fetchExplainRefine`** and **append** new blocks below (scroll). |
| **`ExplainVisualRenderer.tsx`** | Renders API **`visual`** by **kind**: flowchart (`ExplainDiagramSvg`), raw **SVG**, or **HTML** (e.g. table), with light sanitization. |
| **`ExplainDiagramSvg.tsx`** | Node–edge diagram for **flowchart** payloads. |
| **`ArchitectureTab.tsx`** | Search, view modes; **dynamic tree** from API with vertical layout, edges, arrows; **fallback graph** when `children` are missing (depth/outline inference). |
| **`ChatTab.tsx`** | Chat UI; **`fetchChatReply`** with **`paperContext`** and message history. |
| **`pdfLensApi.ts`** (`src/lib/`) | Typed **`fetch`** helpers to **`/api/v2/...`** (see Backend README). |

### Path aliases

- **`@/`** → **`src/`** (see `vite.config.ts` → `resolve.alias`).

---

## How data flows (high level)

1. **User selects text or taps a highlight** in `PDFPane` → **`Index`** updates **`selectionPreview`**, may call **`fetchExplain`**, switches to Explain tab.
2. **Explain response** includes **`explanation`** (string) and **`visual`** (JSON: `kind`, optional `svg`, `html`, `nodes`/`edges`, `caption`).
3. **`ExplainTab`** prefers **`apiVisual`** from the API and renders via **`ExplainVisualRenderer`**; static fallbacks can still use **`visual` as `ReactNode`** from **`Index`** when the API fails.
4. **Architecture tab** — on first open, **`Index`** runs **`useEffect`** once → **`fetchArchitecture(paperText, sectionIds)`** → nodes mapped to **`TreeNode`** for **`ArchitectureTab`**.
5. **Chat tab** — receives **`paperContext`** (full concatenated paper text); **`ChatTab`** sends **`paper_context`**, **`history`**, **`message`** to **`/api/v2/chat`**.

---

## API communication

- **Development:** Vite **`server.proxy`** forwards **`/api`** → **`http://127.0.0.1:8000`** (FastAPI). The frontend calls paths like **`/api/v2/explain`** (same origin in dev → proxied).
- **Production / custom API host:** set **`VITE_API_BASE_URL`** (no trailing slash). `pdfLensApi.ts` uses it as the prefix before **`/api/v2/...`**.

Endpoints used:

- `POST /api/v2/explain` — initial explain.
- `POST /api/v2/explain/refine` — follow-up (**simpler** | **more_detail** | **analogy**).
- `POST /api/v2/architecture` — paper structure tree.
- `POST /api/v2/chat` — grounded chat on paper.

---

## AI integration (frontend perspective)

- The **model is not called from the browser**. The UI only sends **text** (passage, prior explanation, modes, paper excerpt, chat messages).
- **Intent-based visuals:** the backend prompt asks the model to pick **`visual.kind`** (e.g. flowchart vs illustrative SVG vs table). The UI **does not** choose the format; it **renders** whatever structure comes back.
- **Refine thread:** each button adds a **continuation** segment; the **last** segment’s text + visual JSON is sent as context for the next refine.

---

## Features (checklist)

- **Explain** — passage quote, diverse visuals (diagram / SVG / HTML), plain explanation, three **refine** actions with stacked follow-ups.
- **Architecture** — AI-generated section tree; **tree** view with connectors; search; list/radial/mind map where applicable.
- **Chat** — short answers constrained by **paper context**.
- **PDF mock** — scroll, section anchors, highlights, user highlights, jump from tree nodes.

---

## Running locally

From **repository root**, start the API (port **8000**). From **`v2/`**:

```bash
cd v2
npm install
npm run dev
```

Open **http://localhost:8080** (Vite default for this app). Ensure **`GEMINI_API_KEY`** is set for the Python backend (see **`BACKEND-README.md`** at repo root).

```bash
npm run build   # production bundle → dist/
npm run preview # serve dist
```

---

## Relation to the repo root app

The **repository root** also contains a **different** Vite + React app (`package.json` at root) with its own UI. **`v2/`** is the **PDF Lens** product described here; they are **not** the same dev server (root often uses another port, e.g. 5173).

---

## Further reading

- Backend API, prompts, and Gemini wiring: **`../BACKEND-README.md`**
- Google Gemini quotas and limits: [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
