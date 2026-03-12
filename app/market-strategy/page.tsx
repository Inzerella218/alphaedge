"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import FuturesChart from "@/components/futures-chart";
import AlgoSelect from "@/components/ui/algo-select";
import PaperLiveToggle from "@/components/ui/paper-live-toggle";
import KillSwitchButton from "@/components/ui/kill-switch-button";
import MetricCard from "@/components/ui/metric-card";
import type { AlgoKey, AlgoResult, ExecutionMode } from "@/lib/types";

type TimeframeKey = "1 min" | "5 mins" | "15 mins";

const SYMBOLS = ["ES", "MES", "NQ", "MNQ"];

const DEFAULT_WHY = [
  "The chart is loading live futures structure from the backend.",
  "Use scan to rank the active setup against current price behavior.",
  "Then decide whether to engage, wait, or flatten fast.",
];

export default function MarketStrategyPage() {
  const [symbol, setSymbol] = useState("ES");
  const [selectedAlgo, setSelectedAlgo] = useState<AlgoKey>("orb");
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("paper");
  const [timeframe, setTimeframe] = useState<TimeframeKey>("1 min");
  const [qty, setQty] = useState(1);
  const [risk, setRisk] = useState(300);
  const [status, setStatus] = useState("Ready");
  const [killSwitch, setKillSwitch] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [algoResult, setAlgoResult] = useState<AlgoResult | null>(null);

  const derivedBias = useMemo(() => {
    if (algoResult?.signal === "LONG") return "Bullish";
    if (algoResult?.signal === "SHORT") return "Bearish";
    return "Neutral";
  }, [algoResult]);

  const derivedWhy = useMemo(() => {
    if (algoResult?.why && algoResult.why.length > 0) return algoResult.why;
    return DEFAULT_WHY;
  }, [algoResult]);

  async function runScan() {
    if (killSwitch) { setStatus("Kill switch active"); return; }
    setIsScanning(true);
    setStatus("Scanning live futures structure...");
    try {
      const res = await fetch(
        `http://127.0.0.1:8010/algo/scan?algo=${selectedAlgo}&symbol=${symbol}&timeframe=${encodeURIComponent(timeframe)}&risk=${risk}`
      );
      const data = await res.json();
      setAlgoResult(data);
      setStatus("Scan complete");
    } catch {
      setAlgoResult({ error: "Scan failed." });
      setStatus("Scan failed");
    } finally {
      setIsScanning(false);
    }
  }

  useEffect(() => { runScan(); }, [symbol, timeframe, selectedAlgo]);

  useEffect(() => {
    if (!autoScan || killSwitch) return;
    const timer = setInterval(runScan, 8000);
    return () => clearInterval(timer);
  }, [autoScan, killSwitch, symbol, timeframe, selectedAlgo, risk]);

  function handleEngage() {
    if (killSwitch) { setStatus("Kill switch active"); return; }
    setStatus("Algo engaged");
  }

  function handleBuy() {
    if (killSwitch) { setStatus("Kill switch active"); return; }
    setStatus("Buy market triggered");
  }

  function handleSell() {
    if (killSwitch) { setStatus("Kill switch active"); return; }
    setStatus("Sell market triggered");
  }

  return (
    <AppShell>
      <div className="h-full min-h-0 overflow-hidden">
        <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left: header + chart + bottom stats */}
          <div className="grid min-h-0 gap-3 grid-rows-[auto_minmax(0,1fr)_auto]">
            {/* Top bar */}
            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">AlphaEdge</p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight">Futures Trade Cockpit</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {SYMBOLS.map((item) => (
                    <button
                      key={item}
                      onClick={() => setSymbol(item)}
                      className={
                        "rounded-2xl px-3 py-2 text-sm transition " +
                        (symbol === item
                          ? "bg-white text-black"
                          : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                      }
                    >
                      {item}
                    </button>
                  ))}

                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as TimeframeKey)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="1 min">1m</option>
                    <option value="5 mins">5m</option>
                    <option value="15 mins">15m</option>
                  </select>

                  <PaperLiveToggle value={executionMode} onChange={setExecutionMode} />

                  <button
                    onClick={runScan}
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
                  >
                    {isScanning ? "Scanning..." : "Scan"}
                  </button>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="min-h-0">
              <FuturesChart symbol={symbol} timeframe={timeframe} algoResult={algoResult} />
            </div>

            {/* Bottom stats row */}
            <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_1fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Bias</p>
                <p className="mt-2 text-base font-semibold text-white">{derivedBias}</p>
                <p className="mt-1 text-sm text-white/60">Based on live scan result</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Best Fit</p>
                <p className="mt-2 truncate text-base font-semibold text-white">
                  {algoResult?.algo ?? "Waiting for clean setup"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Signal</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {algoResult?.signal ?? "NONE"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Status</p>
                <p className="mt-2 truncate text-base font-semibold text-white">{status}</p>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="grid min-h-0 gap-3 grid-rows-[auto_auto_minmax(0,1fr)_auto]">
            {/* Live reader */}
            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-sm text-white/45">Live Reader</p>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="text-xs text-white/40">Auto-scan</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {autoScan ? "Running every 8s" : "Manual"}
                  </p>
                </div>
                <button
                  onClick={() => setAutoScan((prev) => !prev)}
                  className={
                    "rounded-xl px-3 py-2 text-sm " +
                    (autoScan
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "border border-white/10 bg-white/5 hover:bg-white/10")
                  }
                >
                  {autoScan ? "Auto On" : "Auto Off"}
                </button>
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                <p>Mode: {executionMode.toUpperCase()}</p>
                <p className="mt-1">Kill Switch: {killSwitch ? "ACTIVE" : "OFF"}</p>
              </div>
            </div>

            {/* Setup */}
            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-sm text-white/45">Setup</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
                    Algo
                  </label>
                  <AlgoSelect value={selectedAlgo} onChange={setSelectedAlgo} className="w-full" />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
                    Risk
                  </label>
                  <input
                    type="number"
                    value={risk}
                    onChange={(e) => setRisk(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Why this setup */}
            <div className="min-h-0 rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-sm text-white/45">Why This Setup</p>
              <div className="mt-3 h-full min-h-0 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="space-y-2 text-sm text-white/75">
                    {derivedWhy.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  <button
                    onClick={handleEngage}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium hover:bg-emerald-500"
                  >
                    Engage Algo
                  </button>
                  <button
                    onClick={handleBuy}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                  >
                    Buy Market
                  </button>
                  <button
                    onClick={handleSell}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                  >
                    Sell Market
                  </button>
                  <button
                    onClick={() => setStatus("Close position now triggered")}
                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-500"
                  >
                    Close Position Now
                  </button>
                  <KillSwitchButton
                    active={killSwitch}
                    onActivate={() => { setKillSwitch(true); setStatus("Kill switch active"); }}
                    onReset={() => { setKillSwitch(false); setStatus("Ready"); }}
                  />
                </div>
              </div>
            </div>

            {/* Signal snapshot */}
            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-sm text-white/45">Signal Snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <MetricCard label="Entry" value={String(algoResult?.entry ?? "-")} />
                <MetricCard label="Stop" value={String(algoResult?.stop ?? "-")} />
                <MetricCard label="Target" value={String(algoResult?.target ?? "-")} />
                <MetricCard label="Signal" value={algoResult?.signal ?? "NONE"} />
              </div>
              {algoResult?.error && (
                <p className="mt-3 text-sm text-red-400">{algoResult.error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
