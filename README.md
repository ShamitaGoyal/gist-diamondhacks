# Gist

**Gist** turns dense research into something you can explore: highlight text, see structure, and ask questions—backed by a model that never runs in the browser with your API keys.

This repository contains the **Gist Lens** web client in **`frontend/`** and a **FastAPI** backend at the repository root that holds all Gemini calls.

---

## Inspiration

Research today is powerful but heavy. Whether it is a neuroscience paper, a legal opinion, or an engineering report, understanding even a short passage often takes time and background you may not have. We started from a simple frustration: in an age of AI, why does making sense of a paper still feel slow and manual?

We wanted a tool that makes research feel **interactive**, **visual**, and **intuitive**—something that helps you feel *inside* the document and grasp meaning quickly, instead of rereading the same paragraph for the tenth time.

---

## What it does

When you highlight text in a paper, **Gist** sends that passage to the backend, which asks the model to interpret it and return structured output the UI can render. At a high level the pipeline is:

1. **Parse** the selection in context (what kind of claim, process, or definition it is).
2. **Choose** an informative representation (not a single fixed chart type—the model picks among several visual idioms).
3. **Generate** structured JSON (explanations, optional diagrams, tables, or flow-style graphs).
4. **Render** those structures in the side panel so you can read, zoom, and refine.

The same stack also supports a **paper-level map** of sections and a **chat** surface grounded in the text you have open.

---

## Key features

### Explain (local understanding)

For a highlighted passage, Gist provides:

- A **plain-language explanation**.
- **Visual explanations** chosen for the passage, such as relationship-style maps, flow-style steps, tables, or SVG-style figures—whatever fits the content best, rather than always the same widget.
- **Refinement controls** (e.g. simpler, more detail, analogy) so you can steer follow-up explanations without losing the thread.

### Architecture (global understanding)

Gist extracts a **logical structure** for the document: a tree (or graph-shaped view) of **nodes** (sections or synthesized concepts) and how they relate. That gives you a bird’s-eye view of how the paper is organized and how ideas depend on or support one another.

### Chat (interactive understanding)

You can ask questions about the paper or a highlighted region. Answers are grounded in **extracted text** and **conversation history**, so the document behaves more like a small knowledge base than a static PDF.

---

## Tech stack

### Frontend (`frontend/`)

| Area | Technology |
|------|------------|
| UI | [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| Build / dev | [Vite 5](https://vitejs.dev/), [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) |
| Routing | [React Router](https://reactrouter.com/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) primitives, shadcn-style components |
| PDF | [react-pdf](https://github.com/wojtekmaj/react-pdf), [pdfjs-dist](https://mozilla.github.io/pdf.js/) |
| Forms / validation (available) | [react-hook-form](https://react-hook-form.com/), [Zod](https://zod.dev/) |
| Data fetching (available) | [TanStack Query](https://tanstack.com/query) |
| Tests (available) | [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/), [Playwright](https://playwright.dev/) |

In development, Vite serves the app (default **http://localhost:8080**) and **proxies `/api`** to the Python server on **port 8000**.

### Backend (repository root)

| Area | Technology |
|------|------------|
| API | [FastAPI](https://fastapi.tiangolo.com/) |
| Server | [Uvicorn](https://www.uvicorn.org/) (`run.py` → `app:app`) |
| Config | [python-dotenv](https://pypi.org/project/python-dotenv/) — loads **`.env`** (e.g. `GEMINI_API_KEY`) |
| HTTP to Google | [httpx](https://www.python-httpx.org/) — async calls to Gemini `generateContent` |
| Schemas | [Pydantic](https://docs.pydantic.dev/) v2 |
| Model | **Gemini** (`gemini-2.5-flash` via REST, see `ai/gemini_client.py`) |

**Security:** `GEMINI_API_KEY` lives only on the server. The browser talks to your FastAPI app; it never receives the key.

---

## What each part of the repo does

- **`frontend/`** — The **Gist Lens** UI: PDF reading surface, Explain / Architecture / Chat tabs, and `gistLensApi.ts` helpers that call **`/api/v2/...`** on the backend.
- **`app.py`** — FastAPI app: CORS for local dev, mounts **`/api/v2/*`** routes, and exposes legacy **`POST /analyze`** for an older highlight-to-visual pipeline.
- **`ai/v2_handlers.py`** — Gist Lens HTTP API: explain, explain/refine, architecture, and chat handlers; builds prompts and parses structured model output.
- **`ai/gemini_client.py`** — Central Gemini HTTP client and error handling.
- **`ai/pipeline.py`**, **`ai/parser.py`**, **`ai/prompts.py`** — Legacy **`/analyze`** flow (classification and visual generation).

---

## Running locally

**1. Backend** (from repo root):

```bash
python3 -m pip install -r requirements.txt
# Copy .env.example to .env and set GEMINI_API_KEY=...
python3 run.py
```

API listens on **http://127.0.0.1:8000**.

**2. Frontend** (from `frontend/`):

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:8080**. The dev server proxies **`/api`** to the backend so the UI can call **`/api/v2/explain`**, **`/api/v2/architecture`**, **`/api/v2/chat`**, and related routes without CORS issues.

---

## Environment

| Variable | Where | Purpose |
|----------|--------|---------|
| `GEMINI_API_KEY` | Repo root **`.env`** | Required for Gemini from the Python server. Never commit real keys. |

Optional frontend-only **`VITE_API_BASE_URL`** (no trailing slash) if you are not using the default Vite proxy and need to point the UI at another API origin.
