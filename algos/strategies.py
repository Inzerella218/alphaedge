def opening_range_breakout(candles, risk):
    if len(candles) < 6:
        return {"algo": "Opening Range Breakout", "signal": "NONE", "reason": "Not enough candles", "risk": risk}

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
        return {"algo": "Session Sweep Reclaim", "signal": "NONE", "reason": "Not enough candles", "risk": risk}

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


def vwap_reclaim(candles, risk):
    if len(candles) < 3:
        return {"algo": "VWAP Reclaim", "signal": "NONE", "reason": "Not enough candles", "risk": risk}

    vwap = sum(c["close"] for c in candles[:-1]) / max(len(candles[:-1]), 1)
    prev = candles[-2]
    last = candles[-1]

    if prev["close"] < vwap and last["close"] > vwap:
        stop = min(prev["low"], last["low"])
        return {
            "algo": "VWAP Reclaim",
            "signal": "LONG",
            "entry": last["close"],
            "stop": stop,
            "target": round(last["close"] + ((last["close"] - stop) * 2), 2),
            "risk": risk,
            "vwap": round(vwap, 2)
        }

    if prev["close"] > vwap and last["close"] < vwap:
        stop = max(prev["high"], last["high"])
        return {
            "algo": "VWAP Reclaim",
            "signal": "SHORT",
            "entry": last["close"],
            "stop": stop,
            "target": round(last["close"] - ((stop - last["close"]) * 2), 2),
            "risk": risk,
            "vwap": round(vwap, 2)
        }

    return {
        "algo": "VWAP Reclaim",
        "signal": "NONE",
        "entry": None,
        "stop": None,
        "target": None,
        "risk": risk,
        "vwap": round(vwap, 2)
    }


def opening_pullback(candles, risk):
    if len(candles) < 6:
        return {"algo": "Opening Pullback", "signal": "NONE", "reason": "Not enough candles", "risk": risk}

    opening = candles[:3]
    opening_high = max(c["high"] for c in opening)
    opening_low = min(c["low"] for c in opening)
    last = candles[-1]
    prev = candles[-2]

    if prev["close"] > opening_high and last["low"] <= opening_high and last["close"] > opening_high:
        stop = min(last["low"], opening_low)
        return {
            "algo": "Opening Pullback",
            "signal": "LONG",
            "entry": last["close"],
            "stop": stop,
            "target": round(last["close"] + ((last["close"] - stop) * 2), 2),
            "risk": risk
        }

    if prev["close"] < opening_low and last["high"] >= opening_low and last["close"] < opening_low:
        stop = max(last["high"], opening_high)
        return {
            "algo": "Opening Pullback",
            "signal": "SHORT",
            "entry": last["close"],
            "stop": stop,
            "target": round(last["close"] - ((stop - last["close"]) * 2), 2),
            "risk": risk
        }

    return {
        "algo": "Opening Pullback",
        "signal": "NONE",
        "entry": None,
        "stop": None,
        "target": None,
        "risk": risk
    }


def break_and_hold(candles, risk):
    if len(candles) < 6:
        return {"algo": "Break and Hold", "signal": "NONE", "reason": "Not enough candles", "risk": risk}

    prior = candles[:-2]
    breakout = candles[-2]
    last = candles[-1]

    prior_high = max(c["high"] for c in prior)
    prior_low = min(c["low"] for c in prior)

    if breakout["close"] > prior_high and last["low"] >= prior_high and last["close"] >= prior_high:
        stop = min(breakout["low"], last["low"])
        return {
            "algo": "Break and Hold",
            "signal": "LONG",
            "entry": last["close"],
            "stop": stop,
            "target": round(last["close"] + ((last["close"] - stop) * 2), 2),
            "risk": risk
        }

    if breakout["close"] < prior_low and last["high"] <= prior_low and last["close"] <= prior_low:
        stop = max(breakout["high"], last["high"])
        return {
            "algo": "Break and Hold",
            "signal": "SHORT",
            "entry": last["close"],
            "stop": stop,
            "target": round(last["close"] - ((stop - last["close"]) * 2), 2),
            "risk": risk
        }

    return {
        "algo": "Break and Hold",
        "signal": "NONE",
        "entry": None,
        "stop": None,
        "target": None,
        "risk": risk
    }