from pathlib import Path

import uvicorn

_BACKEND_DIR = Path(__file__).resolve().parent

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(_BACKEND_DIR)],
    )
    