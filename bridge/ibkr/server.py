import asyncio
from flask import Flask, jsonify, request
from ib_insync import IB, Stock

app = Flask(__name__)
ib = IB()


def ensure_event_loop():
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)


@app.get("/health")
def health():
    return jsonify({
        "ok": True,
        "connected": ib.isConnected(),
    })


@app.post("/connect")
def connect():
    try:
        ensure_event_loop()

        data = request.get_json(silent=True) or {}
        host = data.get("host", "127.0.0.1")
        port = int(data.get("port", 7497))
        client_id = int(data.get("clientId", 1))

        if ib.isConnected():
            return jsonify({
                "success": True,
                "connected": True,
                "message": "Already connected",
            })

        ib.connect(host, port, clientId=client_id, timeout=5)

        return jsonify({
            "success": ib.isConnected(),
            "connected": ib.isConnected(),
            "message": "Connected to IBKR" if ib.isConnected() else "Failed to connect",
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "connected": False,
            "error": str(e),
        }), 500


@app.post("/disconnect")
def disconnect():
    try:
        ensure_event_loop()

        if ib.isConnected():
            ib.disconnect()

        return jsonify({
            "success": True,
            "connected": False,
            "message": "Disconnected",
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "connected": ib.isConnected(),
            "error": str(e),
        }), 500


@app.get("/accounts")
def accounts():
    try:
        ensure_event_loop()

        if not ib.isConnected():
            return jsonify({
                "success": False,
                "accounts": [],
                "message": "Not connected",
            }), 400

        values = ib.accountSummary()
        grouped = {}

        for item in values:
            acct = item.account
            grouped.setdefault(acct, {})
            grouped[acct][item.tag] = item.value

        accounts_list = []
        for acct, data in grouped.items():
            accounts_list.append({
                "id": acct,
                "accountName": acct,
                "buyingPower": data.get("BuyingPower"),
                "netLiquidation": data.get("NetLiquidation"),
            })

        return jsonify({
            "success": True,
            "accounts": accounts_list,
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "accounts": [],
            "error": str(e),
        }), 500


@app.get("/price/<symbol>")
def price(symbol):
    try:
        ensure_event_loop()

        if not ib.isConnected():
            return jsonify({
                "success": False,
                "error": "Not connected"
            }), 400

        contract = Stock(symbol.upper(), "SMART", "USD")
        ib.qualifyContracts(contract)

        ticker = ib.reqTickers(contract)[0]

        price_value = (
            ticker.marketPrice()
            or ticker.last
            or ticker.close
            or ticker.bid
            or ticker.ask
        )

        return jsonify({
            "success": True,
            "symbol": symbol.upper(),
            "price": price_value,
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8001, debug=True, threaded=True)