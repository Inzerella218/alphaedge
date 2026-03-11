def opening_range_breakout(candles, risk):
    if len(candles) < 6:
        return {"signal": "NONE", "reason": "Not enough candles"}

    opening = candles[:5]
    opening_high = max(c["high"] for c in opening)
    opening_low = min(c["low"] for c in opening)
    last = candles[-1]["close"]

    if last > opening_high:
        return {
            "algo": "Opening Range Breakout",
            "signal": "LONG",
            "entry": last,
            "stop": opening_low,
            "target": round(last + ((last - opening_low) * 2), 2),
            "risk": risk
        }

    if last < opening_low:
        return {
            "algo": "Opening Range Breakout",
            "signal": "SHORT",
            "entry": last,
            "stop": opening_high,
            "target": round(last - ((opening_high - last) * 2), 2),
            "risk": risk
        }

    return {
        "algo": "Opening Range Breakout",
        "signal": "NONE",
        "entry": None,
        "stop": None,
        "target": None,
        "risk": risk
    }


def sweep_reclaim(candles, risk):
    if len(candles) < 2:
        return {"signal": "NONE", "reason": "Not enough candles"}

    prior = candles[:-1]
    session_high = max(c["high"] for c in prior)
    session_low = min(c["low"] for c in prior)
    last = candles[-1]

    if last["high"] > session_high and last["close"] < session_high:
        return {
            "algo": "Session Sweep Reclaim",
            "signal": "SHORT",
            "entry": last["close"],
            "stop": last["high"],
            "target": round(last["close"] - ((last["high"] - last["close"]) * 2), 2),
            "risk": risk
        }

    if last["low"] < session_low and last["close"] > session_low:
        return {
            "algo": "Session Sweep Reclaim",
            "signal": "LONG",
            "entry": last["close"],
            "stop": last["low"],
            "target": round(last["close"] + ((last["close"] - last["low"]) * 2), 2),
            "risk": risk
        }

    return {
        "algo": "Session Sweep Reclaim",
        "signal": "NONE",
        "entry": None,
        "stop": None,
        "target": None,
        "risk": risk
    }