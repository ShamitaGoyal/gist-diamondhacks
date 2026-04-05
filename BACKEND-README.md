# Backend & AI — Gist / PDF Lens API

This document describes the **Python backend** that serves the **PDF Lens v2** frontend and the **legacy `/analyze`** highlight pipeline. **All Gemini usage is server-side** via the [Google Generative Language API](https://ai.google.dev/api/rest).

---

## Tech stack

| Piece | Technology |
|--------|------------|
| **Framework** | [FastAPI](https://fastapi.tiangolo.com/) |
| **Server** | [Uvicorn](https://www.uvicorn.org/) (`run.py` → `app:app`, default port **8000**) |
| **Config** | [python-dotenv](https://pypi.org/project/python-dotenv/) — loads **`.env`** (e.g. `GEMINI_API_KEY`) |
| **HTTP client** | [httpx](https://www.python-httpx.org/) — async POST to Gemini `generateContent` |
| **Validation / schemas** | [Pydantic](https://docs.pydantic.dev/) v2 models on request/response bodies |
| **Model** | **`gemini-2.5-flash`** via `v1beta` REST (see `ai/gemini_client.py`) |

**Python:** 3.10+ recommended (uses `dict[str, Any]` style type hints in places).

---

## Repository layout (backend-relevant)

```
app.py                 # FastAPI app, CORS, mounts v2 routes, POST /analyze
run.py                 # uvicorn entry (reload dev)
requirements.txt       # fastapi, uvicorn, python-dotenv, pydantic, httpx
.env                   # GEMINI_API_KEY (never commit real keys)
ai/
  gemini_client.py     # Single place that talks to Google; optional raise_api_errors
  v2_handlers.py       # PDF Lens v2 routes: explain, explain/refine, architecture, chat
  json_utils.py        # safe_json_loads — tolerant JSON extraction from model text
  pipeline.py          # Legacy orchestration for /analyze
  parser.py            # Legacy classifiers + visual generators (call_gemini, no raise_api_errors)
  prompts.py           # Prompt strings for legacy flows
```

---

## How the server starts

1. **`python run.py`** (or **`python3 run.py`**) from the **repo root** loads **`app:app`**.
2. **`app.py`**:
   - Adds **CORS** for local frontends: **8080** (v2 PDF Lens), **5173** (typical root Vite).
   - Calls **`register_v2_routes(app)`** so all **`/api/v2/*`** routes are mounted.
   - Exposes **`POST /analyze`** for the **legacy** highlight pipeline.

---

## AI integration: `ai/gemini_client.py`

### What it does

- Builds a **`generationConfig`**: `temperature`, `topP`, `maxOutputTokens`, optional **`responseMimeType`** (e.g. **`application/json`** for structured v2 outputs), optional **`thinkingConfig.thinkingBudget`** (e.g. **`0`** on Architecture to avoid thought tokens eating the JSON budget).
- **POST** to:  
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=...`
- Parses the JSON response:
  - If the API returns an **`error`** object (quota, auth, etc.):
    - **`raise_api_errors=False`** (default, used by **`parser.py`**) → returns **`""`** (callers degrade gracefully).
    - **`raise_api_errors=True`** (used by **v2** via **`_gemini_v2`**) → raises **`GeminiAPIError`** with Google’s **`message`** and **`code`** (e.g. **429**).

### Security

- **`GEMINI_API_KEY`** is read from the environment (**.env** at repo root when the process cwd loads dotenv). The **browser never sees the key**.

---

## PDF Lens v2 API — `ai/v2_handlers.py`

All routes live under prefix **`/api/v2`** (router prefix in code).

Helper **`_gemini_v2(prompt, **kwargs)`** wraps **`call_gemini(..., raise_api_errors=True)`** and maps **`GeminiAPIError`** to:

- **HTTP 429** if **`code == 429`** (rate limit / quota),
- **HTTP 503** for other API errors,

so the client gets a **clear `detail` string** instead of a misleading “invalid JSON” when the model never ran.

### `POST /api/v2/explain`

- **Body:** `{ "text": "<passage to explain>" }`
- **Behavior:** Prompt asks for **plain-language explanation** plus a **`visual`** object whose **`kind`** reflects **intent** (flowchart vs illustrative SVG vs structural SVG vs HTML table vs none), with optional **`caption`**, **`svg`**, **`html`**, **`nodes`/`edges`**.
- **Gemini:** JSON MIME type, **`thinking_budget=0`**, large **`max_output_tokens`** so SVG/HTML in JSON fits.
- **Response:** `{ "explanation": string, "visual": object }`

### `POST /api/v2/explain/refine`

- **Body:** `passage`, `mode` (`simpler` | `more_detail` | `analogy`), `previous_explanation`, optional `previous_visual` (dict).
- **Behavior:** Continues the “conversation” from the **last** explanation + visual; modes adjust prompt (shorter, step-by-step, children’s analogy + analogy-themed visual).
- **Response:** Same shape as **`/explain`**.

### `POST /api/v2/architecture`

- **Body:** `paper_text`, `section_ids[]`
- **Behavior:** Asks for a **title** and **nodes** with **`children`**, **`depth`**, **`sectionId`**, etc.
- **Gemini:** JSON MIME, **`thinking_budget=0`**, high **`max_output_tokens`** to reduce truncated JSON.
- **Response:** `{ "title", "nodes" }`

### `POST /api/v2/chat`

- **Body:** `paper_context`, `history[]` (`role`, `text`), `message`
- **Behavior:** Short, paper-grounded answers from an excerpt of **`paper_context`** + recent history.
- **Response:** `{ "reply": string }`

### Parsing model output

- **`ai/json_utils.safe_json_loads`** tries raw JSON, then fenced ```json blocks, then a brace/bracket slice — helps when the model adds stray characters (v2 still expects clean JSON when using **`responseMimeType`**).

---

## Legacy API: `POST /analyze`

- **Handler:** **`app.py`** → **`process_highlight`** in **`ai/pipeline.py`**.
- **Flow:** **`classify`** → pick visual type → **`generate_*`** (concept map, timeline, etc.) + **`generate_explanation`**.
- **`parser.py`** uses **`call_gemini`** with **`raise_api_errors=False`**; failures tend to return **empty strings** and **fallback structures**, not HTTP errors from Gemini (unless something else raises).

---

## CORS

Configured in **`app.py`** for:

- `http://localhost:8080`, `http://127.0.0.1:8080` — PDF Lens v2  
- `http://localhost:5173`, `http://127.0.0.1:5173` — root Vite app  

Add origins if you use another host/port.

---

## Quotas, rate limits, and errors

Free tier limits are strict (e.g. **requests per day per model**). When exceeded, Google returns **429** with **`RESOURCE_EXHAUSTED`** and hints such as **`RetryInfo`**.

- **v2** surfaces that as **429** with the **message** in **`detail`**.
- **Fixes:** enable billing / higher tier, wait for quota reset, reduce calls, or use another project/key. See [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) and [usage](https://ai.dev/rate-limit).

---

## Running locally

From **repo root**:

```bash
python3 -m pip install -r requirements.txt
# .env should contain GEMINI_API_KEY=...
python3 run.py
```

API listens on **http://0.0.0.0:8000** (or **127.0.0.1:8000** locally).

**With PDF Lens v2:** run **`cd v2 && npm run dev`** so the Vite proxy sends **`/api`** to this server.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| **`GEMINI_API_KEY`** | Required for any Gemini call; loaded via **`load_dotenv()`** in **`gemini_client.py`**. |

---

## Frontend counterpart

Detailed UI architecture, proxy, and feature list: **`v2/README.md`**.

---

## Summary

| Concern | Where it lives |
|--------|----------------|
| HTTP API surface | **`app.py`** + **`ai/v2_handlers.py`** |
| Gemini HTTP + errors | **`ai/gemini_client.py`** |
| v2 prompts & JSON contracts | **`ai/v2_handlers.py`** |
| Lenient JSON parsing | **`ai/json_utils.py`** |
| Legacy highlight AI | **`ai/pipeline.py`**, **`ai/parser.py`**, **`ai/prompts.py`** |

The **frontend** only sends text and JSON bodies; the **backend** holds the key, calls **Gemini**, and returns structured or plain results for Explain, Architecture, Chat, and legacy **/analyze**.
