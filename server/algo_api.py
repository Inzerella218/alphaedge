from fastapi import APIRouter, Query
from algos.strategies import (
    opening_range_breakout,
    sweep_reclaim,
    vwap_reclaim,
    opening_pullback,
    break_and_hold,
)
from server.ibkr_market import get_candles_payload

router = APIRouter()

def _to_algo_candles(bars):
    return [
        {
            "high": float(bar["high"]),
            "low": float(bar["low"]),
            "close": float(bar["close"]),
        }
        for bar in bars
    ]

def _why_for(algo_name: str, signal: str):
    if signal == "LONG":
        return [
            f"{algo_name} is leaning long on current structure.",
            "Price action is supporting upside continuation or reclaim behavior.",
            "Use the chart to confirm acceptance before execution.",
        ]
    if signal == "SHORT":
        return [
            f"{algo_name} is leaning short on current structure.",
            "Price action is supporting downside continuation or failed reclaim behavior.",
            "Use the chart to confirm rejection before execution.",
        ]
    return [
        f"{algo_name} is not fully confirmed right now.",
        "Structure is either mixed or not extended enough yet.",
        "Wait for clearer acceptance or rejection at key levels.",
    ]

@router.get("/algo/test")
def run_algo_test(
    algo: str = Query(...),
    symbol: str = Query("MES"),
    risk: int = Query(300),
):
    fake_candles = [
        {"high": 5280.00, "low": 5272.00, "close": 5278.00},
        {"high": 5282.00, "low": 5275.00, "close": 5280.00},
        {"high": 5285.00, "low": 5279.00, "close": 5284.00},
        {"high": 5287.00, "low": 5280.00, "close": 5286.00},
        {"high": 5288.00, "low": 5282.00, "close": 5287.00},
        {"high": 5291.00, "low": 5284.00, "close": 5289.00},
    ]

    if algo == "orb":
        result = opening_range_breakout(fake_candles, risk)
    elif algo == "sweep":
        result = sweep_reclaim(fake_candles, risk)
    elif algo == "vwap":
        result = vwap_reclaim(fake_candles, risk)
    elif algo == "pullback":
        result = opening_pullback(fake_candles, risk)
    elif algo == "breakhold":
        result = break_and_hold(fake_candles, risk)
    else:
        return {"error": "unknown algo", "algo": algo, "symbol": symbol}

    result["symbol"] = symbol.upper()
    result["why"] = _why_for(result.get("algo", "Algo"), result.get("signal", "NONE"))
    return result

@router.get("/algo/scan")
def scan_algo(
    algo: str = Query(...),
    symbol: str = Query("ES"),
    timeframe: str = Query("1 min"),
    risk: int = Query(300),
):
    bars = get_candles_payload(symbol=symbol, timeframe=timeframe, bars=240)
    candles = _to_algo_candles(bars)

    if algo == "orb":
        result = opening_range_breakout(candles, risk)
    elif algo == "sweep":
        result = sweep_reclaim(candles, risk)
    elif algo == "vwap":
        result = vwap_reclaim(candles, risk)
    elif algo == "pullback":
        result = opening_pullback(candles, risk)
    elif algo == "breakhold":
        result = break_and_hold(candles, risk)
    else:
        return {"error": "unknown algo", "algo": algo, "symbol": symbol.upper()}

    result["symbol"] = symbol.upper()
    result["timeframe"] = timeframe
    result["barsUsed"] = len(candles)
    result["why"] = _why_for(result.get("algo", "Algo"), result.get("signal", "NONE"))
    return result