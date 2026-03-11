from fastapi import APIRouter, Query
from algos.strategies import opening_range_breakout, sweep_reclaim

router = APIRouter()

fake_candles = [
    {"high": 5280.00, "low": 5272.00, "close": 5278.00},
    {"high": 5282.00, "low": 5275.00, "close": 5280.00},
    {"high": 5285.00, "low": 5279.00, "close": 5284.00},
    {"high": 5287.00, "low": 5280.00, "close": 5286.00},
    {"high": 5288.00, "low": 5282.00, "close": 5287.00},
    {"high": 5291.00, "low": 5284.00, "close": 5289.00}
]

@router.get("/algo/test")
def run_algo(
    algo: str = Query(...),
    symbol: str = Query("MES"),
    risk: int = Query(300)
):
    if algo == "orb":
        result = opening_range_breakout(fake_candles, risk)
    elif algo == "sweep":
        result = sweep_reclaim(fake_candles, risk)
    else:
        return {"error": "unknown algo", "algo": algo, "symbol": symbol}

    result["symbol"] = symbol
    return result