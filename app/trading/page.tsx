"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import { indicatorPresets } from "@/lib/indicator-presets";
import { createBroker } from "@/lib/brokers/broker-registry";
import type {
  BrokerAccount,
  BrokerConnectionStatus,
  BrokerOrder,
  BrokerPosition,
  BrokerSymbol,
  BrokerType,
} from "@/lib/brokers/core/types";

const marketSentimentPreset = indicatorPresets.find(
  (preset) => preset.id === "market-sentiment"
);

const stockScannerPreset = indicatorPresets.find(
  (preset) => preset.id === "stock-scanner"
);

export default function TradingPage() {
  const [selectedBrokerType, setSelectedBrokerType] =
    useState<BrokerType>("ibkr");
  const [brokerStatus, setBrokerStatus] =
    useState<BrokerConnectionStatus>("disconnected");
  const [search, setSearch] = useState("");
  const [symbols, setSymbols] = useState<BrokerSymbol[]>([]);
  const [activeSymbol, setActiveSymbol] = useState<BrokerSymbol | null>(null);
  const [statusMessage, setStatusMessage] = useState("Not connected");
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  const [orders, setOrders] = useState<BrokerOrder[]>([]);
  const [orderMessage, setOrderMessage] = useState("No orders submitted yet.");
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [positions, setPositions] = useState<BrokerPosition[]>([]);

  const broker = useMemo(() => createBroker(selectedBrokerType), [selectedBrokerType]);

  useEffect(() => {
    setBrokerStatus("disconnected");
    setStatusMessage("Not connected");
    setSymbols([]);
    setActiveSymbol(null);
    setSearch("");
    setOrders([]);
    setAccounts([]);
    setPositions([]);
    setOrderMessage("No orders submitted yet.");
  }, [selectedBrokerType]);

  async function handleConnect() {
    setBrokerStatus("connecting");
    setStatusMessage("Connecting...");

    const result = await broker.connect();
    setBrokerStatus(result.status);
    setStatusMessage(result.message ?? "Connected");

    setIsLoadingSymbols(true);

    const [brokerSymbols, brokerOrders, brokerAccounts, brokerPositions] =
      await Promise.all([
        broker.getSymbols(),
        broker.getOrders(),
        broker.getAccounts(),
        broker.getPositions(),
      ]);

    setSymbols(brokerSymbols);
    setActiveSymbol(brokerSymbols[0] ?? null);
    setOrders(brokerOrders);
    setAccounts(brokerAccounts);
    setPositions(brokerPositions);

    setIsLoadingSymbols(false);
  }

  async function handleDisconnect() {
    const result = await broker.disconnect();
    setBrokerStatus(result.status);
    setStatusMessage(result.message ?? "Disconnected");
    setSymbols([]);
    setActiveSymbol(null);
    setSearch("");
    setOrders([]);
    setAccounts([]);
    setPositions([]);
    setOrderMessage("No orders submitted yet.");
  }

  async function handlePlaceOrder(side: "buy" | "sell") {
    if (brokerStatus !== "connected") {
      setOrderMessage("Connect a broker before placing an order.");
      return;
    }

    if (!activeSymbol) {
      setOrderMessage("Select a symbol before placing an order.");
      return;
    }

    const order = await broker.placeOrder({
      symbol: activeSymbol.symbol,
      side,
      orderType: "market",
      quantity: 1,
    });

    setOrders((prev) => [order, ...prev]);
    setOrderMessage(
      `${side.toUpperCase()} order submitted for ${activeSymbol.symbol}.`
    );
  }

  async function handleCancelLatestOrder() {
    if (orders.length === 0) {
      setOrderMessage("No orders available to cancel.");
      return;
    }

    const latestOrder = orders[0];
    const success = await broker.cancelOrder(latestOrder.id);

    if (!success) {
      setOrderMessage("Order cancellation failed.");
      return;
    }

    const updatedOrder: BrokerOrder = {
      ...latestOrder,
      status: "cancelled",
    };

    setOrders((prev) => [updatedOrder, ...prev.slice(1)]);
    setOrderMessage(`Order ${latestOrder.id} cancelled.`);
  }

  const filteredSymbols = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return symbols;

    return symbols.filter((item) => {
      return (
        item.symbol.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });
  }, [search, symbols]);

  const primaryAccount = accounts[0];
  const brokerLabel =
    selectedBrokerType === "ibkr"
      ? "Interactive Brokers"
      : selectedBrokerType === "webull"
      ? "Webull"
      : "Paper";
  const accountLabel = primaryAccount
    ? `${primaryAccount.accountName}`
    : "No Account";

  return (
    <AppShell
      brokerLabel={brokerLabel}
      brokerStatus={brokerStatus}
      accountLabel={accountLabel}
    >
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-white/40">
          Execution
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Trading Workspace
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-white/60">
          Two-phase trading workflow for market sentiment and stock scanner execution,
          with broker connectivity, symbol browsing, algo controls, and manual trade override.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black">
          Phase 1: Market Sentiment
        </button>

        <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80">
          Phase 2: Stock Scanner
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Broker Connection</h3>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBrokerType("ibkr")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  selectedBrokerType === "ibkr"
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/80"
                }`}
              >
                Interactive Brokers
              </button>

              <button
                onClick={() => setSelectedBrokerType("webull")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  selectedBrokerType === "webull"
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/80"
                }`}
              >
                Webull
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p>Status: {brokerStatus}</p>
              <p className="mt-1 text-white/50">{statusMessage}</p>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                onClick={handleConnect}
                className="rounded-xl bg-white py-2 font-medium text-black"
              >
                Connect Broker
              </button>

              <button
                onClick={handleDisconnect}
                className="rounded-xl border border-white/10 py-2"
              >
                Disconnect Broker
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Account Summary</h3>

            {primaryAccount ? (
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Account
                  </p>
                  <p className="mt-2 font-medium text-white">
                    {primaryAccount.accountName}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Buying Power
                  </p>
                  <p className="mt-2 font-medium text-white">
                    ${primaryAccount.buyingPower?.toLocaleString() ?? "0"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Net Liquidation
                  </p>
                  <p className="mt-2 font-medium text-white">
                    ${primaryAccount.netLiquidation?.toLocaleString() ?? "0"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
                Connect a broker to load account data.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Symbol Browser</h3>
            <p className="mt-2 text-sm text-white/60">
              Search and click through supported instruments from the selected broker.
            </p>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbols, names, or types..."
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />

            <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {isLoadingSymbols ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
                  Loading symbols...
                </div>
              ) : null}

              {!isLoadingSymbols && brokerStatus !== "connected" ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
                  Connect a broker to load symbols.
                </div>
              ) : null}

              {!isLoadingSymbols &&
                brokerStatus === "connected" &&
                filteredSymbols.map((item) => {
                  const isActive = item.symbol === activeSymbol?.symbol;

                  return (
                    <button
                      key={item.symbol}
                      onClick={() => setActiveSymbol(item)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.symbol}</span>
                        <span
                          className={`text-xs ${
                            isActive ? "text-black/60" : "text-white/40"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>

                      <p
                        className={`mt-1 text-xs ${
                          isActive ? "text-black/70" : "text-white/50"
                        }`}
                      >
                        {item.name}
                      </p>
                    </button>
                  );
                })}

              {!isLoadingSymbols &&
              brokerStatus === "connected" &&
              filteredSymbols.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
                  No symbols found.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  Primary Chart — {activeSymbol?.symbol ?? "No Symbol Selected"}
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  {activeSymbol?.name ?? "Connect broker and choose a symbol"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {indicatorPresets.map((preset) => (
                  <button
                    key={preset.id}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      preset.id === "market-sentiment"
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/80"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                  Add Second Chart
                </button>
              </div>
            </div>

            <div className="flex h-[440px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-white/30">
              Chart panel for {activeSymbol?.symbol ?? "selected symbol"}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-lg font-semibold">Phase 1: Market Sentiment</h3>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <p>Market Mode: Auto Detect</p>
                <p>Bias: Bullish</p>
                <p>Confidence: 62%</p>
                <p>Primary Focus: SPY / QQQ / ES</p>
                <p>Algo Status: Ready</p>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-white/40">
                  Loaded Indicators
                </p>
                <div className="flex flex-wrap gap-2">
                  {marketSentimentPreset?.indicators.map((indicator) => (
                    <span
                      key={indicator}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-lg font-semibold">Phase 2: Stock Scanner</h3>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <p>Scanner Profile: High Demand / Low Supply</p>
                <p>Top Candidates: 3</p>
                <p>Relative Volume Filter: 5x+</p>
                <p>Price Range: $3–$20</p>
                <p>News Catalyst: Required</p>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-white/40">
                  Loaded Indicators
                </p>
                <div className="flex flex-wrap gap-2">
                  {stockScannerPreset?.indicators.map((indicator) => (
                    <span
                      key={indicator}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Open Positions</h3>

            <div className="mt-4 grid gap-3">
              {positions.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
                  No open positions.
                </div>
              ) : (
                positions.map((position) => (
                  <div
                    key={position.symbol}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{position.symbol}</p>
                      <p className="text-white/50">
                        Qty {position.quantity}
                      </p>
                    </div>
                    <p className="mt-2">
                      Avg Price: ${position.averagePrice}
                    </p>
                    <p>Market Price: ${position.marketPrice ?? 0}</p>
                    <p>Unrealized P&L: ${position.unrealizedPnL ?? 0}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Recent Orders</h3>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              {orderMessage}
            </div>

            <div className="mt-4 grid gap-3">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
                  No orders yet.
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                  >
                    <p className="font-medium text-white">
                      {order.side.toUpperCase()} {order.symbol}
                    </p>
                    <p className="mt-1">Type: {order.orderType}</p>
                    <p>Status: {order.status}</p>
                    <p>Quantity: {order.quantity}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/50">Daily P&L</p>
            <p className="mt-2 text-3xl font-semibold">$0.00</p>
            <p className="mt-2 text-sm text-white/60">
              Realized + unrealized session performance
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="mb-3 text-sm text-white/50">Order Entry</p>

            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              Active Symbol: {activeSymbol?.symbol ?? "None"}
            </div>

            <div className="grid gap-2">
              <button
                onClick={() => handlePlaceOrder("buy")}
                className="rounded-xl bg-green-600 py-2 font-medium"
              >
                Buy
              </button>
              <button
                onClick={() => handlePlaceOrder("sell")}
                className="rounded-xl bg-red-600 py-2 font-medium"
              >
                Sell
              </button>
              <button
                onClick={handleCancelLatestOrder}
                className="rounded-xl border border-white/10 py-2"
              >
                Cancel Latest Order
              </button>
              <button className="rounded-xl border border-white/10 py-2">
                Flatten Position
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="mb-3 text-sm text-white/50">Algo Control</p>

            <div className="grid gap-2">
              <button className="rounded-xl border border-white/10 py-2">
                Run Algo
              </button>
              <button className="rounded-xl border border-white/10 py-2">
                Pause Algo
              </button>
              <button className="rounded-xl border border-white/10 py-2">
                Stop Algo
              </button>
              <button className="rounded-xl border border-white/10 py-2">
                Manual Override
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="mb-3 text-sm text-white/50">Preset Library</p>

            <div className="space-y-3 text-sm text-white/70">
              {indicatorPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <p className="font-medium text-white">{preset.name}</p>
                  <p className="mt-1 text-white/50">
                    {preset.indicators.length} indicators loaded
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}