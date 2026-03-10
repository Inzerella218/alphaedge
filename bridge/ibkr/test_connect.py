from ib_insync import IB

ib = IB()

try:
    print("Connecting to IBKR...")
    ib.connect("127.0.0.1", 7497, clientId=1, timeout=5)

    print("CONNECTED:", ib.isConnected())
    print("ACCOUNTS:", ib.managedAccounts())

    summary = ib.accountSummary()
    print("ACCOUNT SUMMARY ROWS:", len(summary))

    for row in summary[:10]:
        print(row)

except Exception as e:
    print("ERROR:", str(e))

finally:
    if ib.isConnected():
        ib.disconnect()
        print("Disconnected.")
