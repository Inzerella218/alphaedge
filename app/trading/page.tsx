"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import AlgoSelect from "@/components/ui/algo-select";
import PaperLiveToggle from "@/components/ui/paper-live-toggle";
import KillSwitchButton from "@/components/ui/kill-switch-button";
import MetricCard from "@/components/ui/metric-card";
import BrokerPanel from "@/components/trading/broker-panel";
import RiskControls from "@/components/trading/risk-controls";
import WatchlistPanel from "@/components/trading/watchlist-panel";
import AlgoSignalPanel from "@/components/trading/algo-signal-panel";
import PositionSnapshot from "@/components/trading/position-snapshot";
import OrdersPanel from "@/components/trading/orders-panel";
import ManualOrderPanel from "@/components/trading/manual-order-panel";
import AlgoControlsPanel from "@/components/trading/algo-controls-panel";
import AccountSummary from "@/components/trading/account-summary";
import { createBroker } from "@/lib/brokers/broker-registry";
import type { AlgoKey, AlgoResult, ExecutionMode } from "@/lib/types";
import type {
  BrokerAccount,
  BrokerConnectionStatus,
  BrokerOrder,
  BrokerPosition,
  BrokerSymbol,
  BrokerType,
} from "@/lib/brokers/core/types";

type AlgoStatus = "idle" | "armed" | "paused" | "in-trade" | "killed";

export default function TradingPage() {
  // Broker state
  const [selectedBrokerType, setSelectedBrokerType] = useState<BrokerType>("ibkr");
  const [brokerStatus, setBrokerStatus] = useState<BrokerConnectionStatus>("disconnected");
  const [statusMessage, setStatusMessage] = useState("Not connected");
  const [symbols, setSymbols] = useState<BrokerSymbol[]>([]);
  const [activeSymbol, setActiveSymbol] = useState<BrokerSymbol | null>(null);
  const [search, setSearch] = useState("");
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  const [orders, setOrders] = useState<BrokerOrder[]>([]);
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [positions, setPositions] = useState<BrokerPosition[]>([]);
  const [orderMessage, setOrderMessage] = useState("No orders submitted yet.");

  // Algo + execution state
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
    const [brokerSymbols, brokerOrders, brokerAccounts, brokerPositions] = await Promise.all([
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
    if (killSwitch) { setOrderMessage("Kill switch is active. Order blocked."); return; }
    if (brokerStatus !== "connected") { setOrderMessage("Connect a broker before placing an order."); return; }
    if (!activeSymbol) { setOrderMessage("Select a symbol before placing an order."); return; }
    if (confirmBeforeSend) {
      const approved = window.confirm(
        `${side.toUpperCase()} ${quantity} ${activeSymbol.symbol} in ${executionMode.toUpperCase()} mode?`
      );
      if (!approved) { setOrderMessage("Order cancelled before send."); return; }
    }
    const order = await broker.placeOrder({ symbol: activeSymbol.symbol, side, orderType: "market", quantity });
    setOrders((prev) => [order, ...prev]);
    setOrderMessage(`${side.toUpperCase()} order submitted for ${activeSymbol.symbol} x${quantity}.`);
  }

  async function handleCancelLatestOrder() {
    if (orders.length === 0) { setOrderMessage("No orders available to cancel."); return; }
    const latestOrder = orders[0];
    const success = await broker.cancelOrder(latestOrder.id);
    if (!success) { setOrderMessage("Order cancellation failed."); return; }
    setOrders((prev) => [{ ...latestOrder, status: "cancelled" }, ...prev.slice(1)]);
    setOrderMessage(`Order ${latestOrder.id} cancelled.`);
  }

  async function handleFlattenPosition() {
    if (brokerStatus !== "connected") { setOrderMessage("Connect a broker before closing a position."); return; }
    const currentPosition = positions.find((p) => p.symbol === activeSymbol?.symbol) ?? positions[0];
    if (!currentPosition) { setOrderMessage("No open position to close."); return; }
    const qty = Math.abs(Number(currentPosition.quantity) || 0);
    if (qty <= 0) { setOrderMessage("No open position to close."); return; }
    const closeSide = currentPosition.quantity > 0 ? "sell" : "buy";
    const closeText = closeSide === "sell" ? "Sell to Close NOW" : "Buy to Close NOW";
    const approved = window.confirm(`${closeText} ${qty} ${currentPosition.symbol} at market?`);
    if (!approved) { setOrderMessage("Close position cancelled."); return; }
    const order = await broker.placeOrder({ symbol: currentPosition.symbol, side: closeSide, orderType: "market", quantity: qty });
    setOrders((prev) => [order, ...prev]);
    setOrderMessage(`${closeText} submitted for ${currentPosition.symbol} x${qty}.`);
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
    if (!activeSymbol) { setAlgoResult({ error: "Select a symbol first." }); return; }
    if (killSwitch) { setAlgoResult({ error: "Kill switch is active." }); return; }
    setIsRunningAlgo(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8010/algo/test?algo=${selectedAlgo}&symbol=${activeSymbol.symbol}&risk=${riskPerTrade}`
      );
      const data = await res.json();
      setAlgoResult(data);
      setAlgoStatus("armed");
    } catch {
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
    if (killSwitch) { setOrderMessage("Kill switch is active. Reset it before arming algo."); return; }
    setAlgoStatus("armed");
    setPauseNewEntries(false);
    setOrderMessage("Algo armed and awaiting signal.");
  }

  const filteredSymbols = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return symbols;
    return symbols.filter((item) =>
      item.symbol.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    );
  }, [search, symbols]);

  const primaryAccount = accounts[0] ?? null;
  const lastPosition = positions.find((p) => p.symbol === activeSymbol?.symbol) ?? positions[0] ?? null;
  const closeButtonLabel = lastPosition
    ? Number(lastPosition.quantity) > 0 ? "Sell to Close NOW" : "Buy to Close NOW"
    : "Close Position Now";
  const brokerLabel =
    selectedBrokerType === "ibkr" ? "Interactive Brokers" :
    selectedBrokerType === "webull" ? "Webull" : "Paper";
  const statusTone =
    algoStatus === "armed" ? "text-emerald-400" :
    algoStatus === "paused" ? "text-yellow-400" :
    algoStatus === "killed" ? "text-red-400" :
    algoStatus === "in-trade" ? "text-blue-400" : "text-white";

  return (
    <AppShell
      brokerLabel={brokerLabel}
      brokerStatus={brokerStatus}
      accountLabel={primaryAccount?.accountName ?? "No Account"}
    >
      <div className="h-full overflow-y-auto pr-1">
        <div className="space-y-4 pb-4">
          {/* Command Header */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Execution</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                  Trading Command Center
                </h1>
                <p className="mt-2 text-sm text-white/60">
                  Clean execution layout with broker control, algo control, and a focused chart area.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Symbol" value={activeSymbol?.symbol ?? "None"} />
                <MetricCard label="Mode" value={executionMode.toUpperCase()} />
                <MetricCard label="Algo" value={selectedAlgo.toUpperCase()} />
                <MetricCard label="Status" value={algoStatus.toUpperCase()} valueClass={statusTone} />
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_auto_auto_auto]">
              <AlgoSelect value={selectedAlgo} onChange={setSelectedAlgo} />
              <PaperLiveToggle value={executionMode} onChange={setExecutionMode} />
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
              <KillSwitchButton
                active={killSwitch}
                onActivate={handleKillSwitch}
                onReset={handleResetKillSwitch}
              />
            </div>
          </div>

          {/* 3-column layout */}
          <div className="grid min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            {/* Left: Broker / Risk / Watchlist */}
            <div className="space-y-4">
              <BrokerPanel
                selectedBrokerType={selectedBrokerType}
                onSelectBroker={setSelectedBrokerType}
                brokerStatus={brokerStatus}
                statusMessage={statusMessage}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
              <RiskControls
                quantity={quantity}
                setQuantity={setQuantity}
                riskPerTrade={riskPerTrade}
                setRiskPerTrade={setRiskPerTrade}
                maxDailyLoss={maxDailyLoss}
                setMaxDailyLoss={setMaxDailyLoss}
              />
              <WatchlistPanel
                brokerStatus={brokerStatus}
                isLoadingSymbols={isLoadingSymbols}
                filteredSymbols={filteredSymbols}
                activeSymbol={activeSymbol}
                onSelect={setActiveSymbol}
                search={search}
                setSearch={setSearch}
              />
            </div>

            {/* Middle: Chart / Signal / Position / Orders */}
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
                    {["Opening Range", "VWAP", "Session H/L"].map((label) => (
                      <span
                        key={label}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70"
                      >
                        {label}
                      </span>
                    ))}
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
                        <MetricCard label="Entry" value={String(algoResult?.entry ?? "-")} />
                        <MetricCard label="Stop" value={String(algoResult?.stop ?? "-")} valueClass="text-red-400" />
                        <MetricCard label="Target" value={String(algoResult?.target ?? "-")} valueClass="text-blue-400" />
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
                <AlgoSignalPanel
                  isRunningAlgo={isRunningAlgo}
                  algoResult={algoResult}
                  riskPerTrade={riskPerTrade}
                  onCheck={runAlgoCheck}
                  onPause={handlePauseAlgo}
                />
                <PositionSnapshot lastPosition={lastPosition} />
              </div>

              <OrdersPanel orders={orders} orderMessage={orderMessage} />
            </div>

            {/* Right: P&L / Orders / Controls / Account */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-white/50">Daily P&L</p>
                <p className="mt-2 text-3xl font-semibold">$0.00</p>
                <p className="mt-2 text-sm text-white/60">
                  Session target and loss locks will live here.
                </p>
              </div>
              <ManualOrderPanel
                activeSymbol={activeSymbol}
                closeButtonLabel={closeButtonLabel}
                onBuy={() => handlePlaceOrder("buy")}
                onSell={() => handlePlaceOrder("sell")}
                onCancelLatest={handleCancelLatestOrder}
                onClose={handleFlattenPosition}
                onFlattenAll={handleFlattenAll}
              />
              <AlgoControlsPanel
                pauseNewEntries={pauseNewEntries}
                setPauseNewEntries={setPauseNewEntries}
                confirmBeforeSend={confirmBeforeSend}
                setConfirmBeforeSend={setConfirmBeforeSend}
                autoBrackets={autoBrackets}
                setAutoBrackets={setAutoBrackets}
                killSwitch={killSwitch}
                executionMode={executionMode}
                maxDailyLoss={maxDailyLoss}
              />
              <AccountSummary account={primaryAccount} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
