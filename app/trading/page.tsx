"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import { createBroker } from "@/lib/brokers/broker-registry";
import type {
  BrokerAccount,
  BrokerConnectionStatus,
  BrokerOrder,
  BrokerPosition,
  BrokerSymbol,
  BrokerType,
} from "@/lib/brokers/core/types";

type AlgoKey = "orb" | "sweep" | "vwap" | "pullback" | "breakhold";
type ExecutionMode = "paper" | "live";
type AlgoStatus = "idle" | "armed" | "paused" | "in-trade" | "killed";

type AlgoResult = {
  algo?: string;
  signal?: string;
  entry?: number | null;
  stop?: number | null;
  target?: number | null;
  risk?: number;
  symbol?: string;
  error?: string;
};

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

  const [executionMode, setExecutionMode] = useState<ExecutionMode>("paper");
  const [selectedAlgo, setSelectedAlgo] = useState<AlgoKey>("orb");
  const [algoStatus, setAlgoStatus] = useState<AlgoStatus>("idle");
  const [quantity, setQuantity] = useState(1);
  const [riskPerTrade, setRiskPerTrade] = useState(300);
  const [maxDailyLoss, setMaxDailyLoss] = useState(1000);
  const [pauseNewEntries, setPauseNewEntries] = useState(false);
  const [confirmBeforeSend, setConfirmBeforeSend] = useState(true);
  const [autoBrackets, setAutoBrackets] = useState(true);
  const [killSwitch, setKillSwitch] = useState(false);
  const [isRunningAlgo, setIsRunningAlgo] = useState(false);
  const [algoResult, setAlgoResult] = useState<AlgoResult | null>(null);

  const broker = useMemo(
    () => createBroker(selectedBrokerType),
    [selectedBrokerType]
  );

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
    setActiveSymbol((current) => current ?? brokerSymbols[0] ?? null);
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
    if (killSwitch) {
      setOrderMessage("Kill switch is active. Order blocked.");
      return;
    }

    if (brokerStatus !== "connected") {
      setOrderMessage("Connect a broker before placing an order.");
      return;
    }

    if (!activeSymbol) {
      setOrderMessage("Select a symbol before placing an order.");
      return;
    }

    if (confirmBeforeSend) {
      const approved = window.confirm(
        side.toUpperCase() +
          " " +
          quantity +
          " " +
          activeSymbol.symbol +
          " in " +
          executionMode.toUpperCase() +
          " mode?"
      );

      if (!approved) {
        setOrderMessage("Order cancelled before send.");
        return;
      }
    }

    const order = await broker.placeOrder({
      symbol: activeSymbol.symbol,
      side,
      orderType: "market",
      quantity,
    });

    setOrders((prev) => [order, ...prev]);
    setOrderMessage(
      side.toUpperCase() +
        " order submitted for " +
        activeSymbol.symbol +
        " x" +
        quantity +
        "."
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
    setOrderMessage("Order " + latestOrder.id + " cancelled.");
  }

  async function handleFlattenPosition() {
    if (brokerStatus !== "connected") {
      setOrderMessage("Connect a broker before closing a position.");
      return;
    }

    const currentPosition =
      positions.find((p) => p.symbol === activeSymbol?.symbol) ?? positions[0];

    if (!currentPosition) {
      setOrderMessage("No open position to close.");
      return;
    }

    const qty = Math.abs(Number(currentPosition.quantity) || 0);

    if (qty <= 0) {
      setOrderMessage("No open position to close.");
      return;
    }

    const closeSide = currentPosition.quantity > 0 ? "sell" : "buy";
    const closeText = closeSide === "sell" ? "Sell to Close NOW" : "Buy to Close NOW";

    const approved = window.confirm(
      closeText + " " + qty + " " + currentPosition.symbol + " at market?"
    );

    if (!approved) {
      setOrderMessage("Close position cancelled.");
      return;
    }

    const order = await broker.placeOrder({
      symbol: currentPosition.symbol,
      side: closeSide,
      orderType: "market",
      quantity: qty,
    });

    setOrders((prev) => [order, ...prev]);
    setOrderMessage(closeText + " submitted for " + currentPosition.symbol + " x" + qty + ".");
  }

  function handleFlattenAll() {
    setAlgoStatus("paused");
    setOrderMessage("Flatten all triggered.");
  }

  function handleKillSwitch() {
    setKillSwitch(true);
    setAlgoStatus("killed");
    setPauseNewEntries(true);
    setOrderMessage("KILL SWITCH ACTIVE - new entries blocked.");
  }

  function handleResetKillSwitch() {
    setKillSwitch(false);
    setAlgoStatus("idle");
    setOrderMessage("Kill switch reset. Manual control restored.");
  }

  async function runAlgoCheck() {
    if (!activeSymbol) {
      setAlgoResult({ error: "Select a symbol first." });
      return;
    }

    if (killSwitch) {
      setAlgoResult({ error: "Kill switch is active." });
      return;
    }

    setIsRunningAlgo(true);

    try {
      const res = await fetch(
        "http://127.0.0.1:8010/algo/test?algo=" +
          selectedAlgo +
          "&symbol=" +
          activeSymbol.symbol +
          "&risk=" +
          riskPerTrade
      );

      const data = await res.json();
      setAlgoResult(data);
      setAlgoStatus("armed");
    } catch (error) {
      setAlgoResult({ error: "Backend connection failed." });
    } finally {
      setIsRunningAlgo(false);
    }
  }

  function handlePauseAlgo() {
    setAlgoStatus("paused");
    setPauseNewEntries(true);
    setOrderMessage("Algo paused. No new entries allowed.");
  }

  function handleArmAlgo() {
    if (killSwitch) {
      setOrderMessage("Kill switch is active. Reset it before arming algo.");
      return;
    }

    setAlgoStatus("armed");
    setPauseNewEntries(false);
    setOrderMessage("Algo armed and awaiting signal.");
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
    ? primaryAccount.accountName
    : "No Account";

  const statusTone =
    algoStatus === "armed"
      ? "text-emerald-400"
      : algoStatus === "paused"
      ? "text-yellow-400"
      : algoStatus === "killed"
      ? "text-red-400"
      : algoStatus === "in-trade"
      ? "text-blue-400"
      : "text-white";

  const lastPosition =
    positions.find((p) => p.symbol === activeSymbol?.symbol) ?? positions[0] ?? null;

  const closeButtonLabel = lastPosition
    ? Number(lastPosition.quantity) > 0
      ? "Sell to Close NOW"
      : "Buy to Close NOW"
    : "Close Position Now";

  return (
    <AppShell
      brokerLabel={brokerLabel}
      brokerStatus={brokerStatus}
      accountLabel={accountLabel}
    >
      <div className="h-full overflow-y-auto pr-1">
        <div className="space-y-4 pb-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                  Execution
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                  Trading Command Center
                </h1>
                <p className="mt-2 text-sm text-white/60">
                  Clean execution layout with broker control, algo control, and a focused chart area.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-white/40">Symbol</p>
                  <p className="mt-1 font-medium text-white">
                    {activeSymbol?.symbol ?? "None"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-white/40">Mode</p>
                  <p className="mt-1 font-medium text-white">
                    {executionMode.toUpperCase()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-white/40">Algo</p>
                  <p className="mt-1 font-medium text-white">
                    {selectedAlgo.toUpperCase()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-white/40">Status</p>
                  <p className={"mt-1 font-medium " + statusTone}>
                    {algoStatus.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_auto_auto_auto]">
              <select
                value={selectedAlgo}
                onChange={(e) => setSelectedAlgo(e.target.value as AlgoKey)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="orb">Opening Range Breakout</option>
                <option value="sweep">Session Sweep Reclaim</option>
                <option value="vwap">VWAP Reclaim</option>
                <option value="pullback">Opening Pullback</option>
                <option value="breakhold">Break and Hold</option>
              </select>

              <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => setExecutionMode("paper")}
                  className={
                    "flex-1 rounded-xl px-4 py-2 text-sm " +
                    (executionMode === "paper"
                      ? "bg-white text-black"
                      : "text-white/70")
                  }
                >
                  Paper
                </button>
                <button
                  onClick={() => setExecutionMode("live")}
                  className={
                    "flex-1 rounded-xl px-4 py-2 text-sm " +
                    (executionMode === "live"
                      ? "bg-white text-black"
                      : "text-white/70")
                  }
                >
                  Live
                </button>
              </div>

              <button
                onClick={handleArmAlgo}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium hover:bg-emerald-500"
              >
                Engage Algo
              </button>

              <button
                onClick={handlePauseAlgo}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
              >
                Pause
              </button>

              <button
                onClick={handleFlattenPosition}
                className={
                  "rounded-2xl px-4 py-3 text-sm font-semibold " +
                  (lastPosition
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "border border-white/10 bg-white/5 text-white/60")
                }
              >
                {closeButtonLabel}
              </button>

              {!killSwitch ? (
                <button
                  onClick={handleKillSwitch}
                  className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-500"
                >
                  Kill Switch
                </button>
              ) : (
                <button
                  onClick={handleResetKillSwitch}
                  className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20"
                >
                  Reset Kill Switch
                </button>
              )}
            </div>
          </div>

          <div className="grid min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="text-lg font-semibold">Broker</h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedBrokerType("ibkr")}
                    className={
                      "rounded-xl px-4 py-2 text-sm " +
                      (selectedBrokerType === "ibkr"
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/80")
                    }
                  >
                    IBKR
                  </button>

                  <button
                    onClick={() => setSelectedBrokerType("webull")}
                    className={
                      "rounded-xl px-4 py-2 text-sm " +
                      (selectedBrokerType === "webull"
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white/80")
                    }
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

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="text-lg font-semibold">Risk Controls</h3>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
                      Risk Per Trade
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={riskPerTrade}
                      onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
                      Max Daily Loss
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={maxDailyLoss}
                      onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="text-lg font-semibold">Watchlist</h3>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search symbols..."
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />

                <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
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
                          className={
                            "w-full rounded-2xl border px-4 py-3 text-left transition " +
                            (isActive
                              ? "border-white bg-white text-black"
                              : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10")
                          }
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.symbol}</span>
                            <span
                              className={
                                "text-xs " +
                                (isActive ? "text-black/60" : "text-white/40")
                              }
                            >
                              {item.type}
                            </span>
                          </div>

                          <p
                            className={
                              "mt-1 text-xs " +
                              (isActive ? "text-black/70" : "text-white/50")
                            }
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

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">
                      {activeSymbol?.symbol ?? "No Symbol Selected"}
                    </h3>
                    <p className="mt-1 text-sm text-white/50">
                      {activeSymbol?.name ?? "Connect broker and select a symbol"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                      Opening Range
                    </span>
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                      VWAP
                    </span>
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                      Session H/L
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/35">
                    <span>Live Chart Area</span>
                    <span>{activeSymbol?.symbol ?? "No Symbol"}</span>
                  </div>

                  <div className="mt-4 flex h-[460px] flex-col justify-between rounded-2xl border border-dashed border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
                    <div>
                      <p className="text-sm text-white/40">Chart overlay targets</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs text-white/40">Entry</p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {algoResult?.entry ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs text-white/40">Stop</p>
                          <p className="mt-1 text-sm font-medium text-red-400">
                            {algoResult?.stop ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs text-white/40">Target</p>
                          <p className="mt-1 text-sm font-medium text-blue-400">
                            {algoResult?.target ?? "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/45">
                      Chart container ready. Next step: wire TradingView or lightweight-charts and draw
                      live entry, stop, target, opening range, VWAP, and session levels.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="text-lg font-semibold">Algo Signal</h3>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    {isRunningAlgo ? (
                      <p className="text-sm text-white/60">Checking signal...</p>
                    ) : algoResult?.error ? (
                      <p className="text-sm text-red-400">{algoResult.error}</p>
                    ) : algoResult ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-black/20 p-4">
                          <p className="text-xs text-white/40">Signal</p>
                          <p className="mt-1 text-sm font-medium text-emerald-400">
                            {algoResult.signal ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-black/20 p-4">
                          <p className="text-xs text-white/40">Algorithm</p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {algoResult.algo ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-black/20 p-4">
                          <p className="text-xs text-white/40">Entry</p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {algoResult.entry ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-black/20 p-4">
                          <p className="text-xs text-white/40">Risk</p>
                          <p className="mt-1 text-sm font-medium text-white">
                            ${algoResult.risk ?? riskPerTrade}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-white/60">
                        No signal loaded yet. Run a check when you are ready.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      onClick={runAlgoCheck}
                      className="rounded-xl bg-emerald-600 py-2 font-medium hover:bg-emerald-500"
                    >
                      Check Signal
                    </button>

                    <button
                      onClick={handlePauseAlgo}
                      className="rounded-xl border border-white/10 py-2"
                    >
                      Pause New Entries
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="text-lg font-semibold">Position Snapshot</h3>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/40">Current Position</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {lastPosition ? lastPosition.symbol : "Flat"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/40">Quantity</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {lastPosition ? lastPosition.quantity : 0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/40">Average Price</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {lastPosition ? "$" + lastPosition.averagePrice : "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/40">Unrealized P&L</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {lastPosition ? "$" + (lastPosition.unrealizedPnL ?? 0) : "$0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="text-lg font-semibold">Orders</h3>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  {orderMessage}
                </div>

                <div className="mt-4 max-h-[280px] overflow-y-auto pr-1 grid gap-3">
                  {orders.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
                      No orders yet.
                    </div>
                  ) : (
                    orders.slice(0, 6).map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white">
                            {order.side.toUpperCase()} {order.symbol}
                          </p>
                          <p className="text-white/40">{order.status}</p>
                        </div>
                        <p className="mt-2">Type: {order.orderType}</p>
                        <p>Quantity: {order.quantity}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-white/50">Daily P&L</p>
                <p className="mt-2 text-3xl font-semibold">$0.00</p>
                <p className="mt-2 text-sm text-white/60">
                  Session target and loss locks will live here.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-sm text-white/50">Manual Order Entry</p>

                <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  Active Symbol: {activeSymbol?.symbol ?? "None"}
                </div>

                <div className="grid gap-2">
                  <button
                    onClick={() => handlePlaceOrder("buy")}
                    className="rounded-xl bg-green-600 py-2 font-medium hover:bg-green-500"
                  >
                    Buy Market
                  </button>

                  <button
                    onClick={() => handlePlaceOrder("sell")}
                    className="rounded-xl bg-red-600 py-2 font-medium hover:bg-red-500"
                  >
                    Sell Market
                  </button>

                  <button className="rounded-xl border border-white/10 py-2">
                    Buy Limit
                  </button>

                  <button className="rounded-xl border border-white/10 py-2">
                    Sell Limit
                  </button>

                  <button
                    onClick={handleCancelLatestOrder}
                    className="rounded-xl border border-white/10 py-2"
                  >
                    Cancel Latest Order
                  </button>

                  <button
                    onClick={handleFlattenPosition}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-red-200 hover:bg-red-500/20"
                  >
                    {closeButtonLabel}
                  </button>

                  <button
                    onClick={handleFlattenAll}
                    className="rounded-xl border border-orange-500/30 bg-orange-500/10 py-2 text-orange-200"
                  >
                    Flatten All
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-sm text-white/50">Algo Controls</p>

                <div className="space-y-3">
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                    <span>Pause New Entries</span>
                    <input
                      type="checkbox"
                      checked={pauseNewEntries}
                      onChange={(e) => setPauseNewEntries(e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                    <span>Confirm Before Send</span>
                    <input
                      type="checkbox"
                      checked={confirmBeforeSend}
                      onChange={(e) => setConfirmBeforeSend(e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                    <span>Auto Brackets</span>
                    <input
                      type="checkbox"
                      checked={autoBrackets}
                      onChange={(e) => setAutoBrackets(e.target.checked)}
                    />
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    <p>Kill Switch: {killSwitch ? "ACTIVE" : "OFF"}</p>
                    <p className="mt-1">Execution Mode: {executionMode.toUpperCase()}</p>
                    <p className="mt-1">Max Daily Loss: ${maxDailyLoss}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-sm text-white/50">Account Summary</p>

                {primaryAccount ? (
                  <div className="space-y-3 text-sm text-white/70">
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
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
                    Connect a broker to load account data.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}