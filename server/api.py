from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.ibkr_scanner import get_scanner_snapshot
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/scanner")
def scanner():
    try:
        return get_scanner_snapshot()
    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
