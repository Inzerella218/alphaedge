"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import FuturesChart from "@/components/futures-chart";

type AlgoKey = "orb" | "sweep" | "vwap" | "pullback" | "breakhold";
type ExecutionMode = "paper" | "live";
type TimeframeKey = "1 min" | "5 mins" | "15 mins";

type AlgoResult = {
  algo?: string;
  signal?: string;
  entry?: number | null;
  stop?: number | null;
  target?: number | null;
  risk?: number;
  symbol?: string;
  error?: string;
  why?: string[];
};

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

  const symbolButtons = ["ES", "MES", "NQ", "MNQ"];

  const derivedBias = useMemo(() => {
    if (algoResult?.signal === "LONG") return "Bullish";
    if (algoResult?.signal === "SHORT") return "Bearish";
    return "Neutral";
  }, [algoResult]);

  const derivedBestAlgo = useMemo(() => {
    return algoResult?.algo ?? "Waiting for clean setup";
  }, [algoResult]);

  const derivedWhy = useMemo(() => {
    if (algoResult?.why && algoResult.why.length > 0) return algoResult.why;
    return [
      "The chart is loading live futures structure from the backend.",
      "Use scan to rank the active setup against current price behavior.",
      "Then decide whether to engage, wait, or flatten fast.",
    ];
  }, [algoResult]);

  async function runScan() {
    if (killSwitch) {
      setStatus("Kill switch active");
      return;
    }

    setIsScanning(true);
    setStatus("Scanning live futures structure...");

    try {
      const res = await fetch(
        "http://127.0.0.1:8010/algo/scan?algo=" +
          selectedAlgo +
          "&symbol=" +
          symbol +
          "&timeframe=" +
          encodeURIComponent(timeframe) +
          "&risk=" +
          risk
      );

      const data = await res.json();
      setAlgoResult(data);
      setStatus("Scan complete");
    } catch (error) {
      setAlgoResult({ error: "Scan failed." });
      setStatus("Scan failed");
    } finally {
      setIsScanning(false);
    }
  }

  useEffect(() => {
    runScan();
  }, [symbol, timeframe, selectedAlgo]);

  useEffect(() => {
    if (!autoScan || killSwitch) return;

    const timer = setInterval(() => {
      runScan();
    }, 8000);

    return () => clearInterval(timer);
  }, [autoScan, killSwitch, symbol, timeframe, selectedAlgo, risk]);

  function handleEngage() {
    if (killSwitch) {
      setStatus("Kill switch active");
      return;
    }
    setStatus("Algo engaged");
  }

  function handleBuy() {
    if (killSwitch) {
      setStatus("Kill switch active");
      return;
    }
    setStatus("Buy market triggered");
  }

  function handleSell() {
    if (killSwitch) {
      setStatus("Kill switch active");
      return;
    }
    setStatus("Sell market triggered");
  }

  function handleCloseNow() {
    setStatus("Close position now triggered");
  }

  function handleKillSwitch() {
    setKillSwitch(true);
    setStatus("Kill switch active");
  }

  function handleResetKillSwitch() {
    setKillSwitch(false);
    setStatus("Ready");
  }

  return (
    <AppShell>
      <div className="h-full min-h-0 overflow-hidden">
        <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-h-0 gap-3 grid-rows-[auto_minmax(0,1fr)_auto]">
            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                    AlphaEdge
                  </p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight">
                    Futures Trade Cockpit
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {symbolButtons.map((item) => (
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

                  <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
                    <button
                      onClick={() => setExecutionMode("paper")}
                      className={
                        "rounded-xl px-3 py-1.5 text-sm " +
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
                        "rounded-xl px-3 py-1.5 text-sm " +
                        (executionMode === "live"
                          ? "bg-white text-black"
                          : "text-white/70")
                      }
                    >
                      Live
                    </button>
                  </div>

                  <button
                    onClick={runScan}
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
                  >
                    {isScanning ? "Scanning..." : "Scan"}
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0">
              <FuturesChart
                symbol={symbol}
                timeframe={timeframe}
                algoResult={algoResult}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_1fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Bias</p>
                <p className="mt-2 text-base font-semibold text-white">{derivedBias}</p>
                <p className="mt-1 text-sm text-white/60">Based on live scan result</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">Best Fit</p>
                <p className="mt-2 text-base font-semibold text-white truncate">
                  {derivedBestAlgo}
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
                <p className="mt-2 text-base font-semibold text-white truncate">
                  {status}
                </p>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 gap-3 grid-rows-[auto_auto_minmax(0,1fr)_auto]">
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

            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-sm text-white/45">Setup</p>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
                    Algo
                  </label>
                  <select
                    value={selectedAlgo}
                    onChange={(e) => setSelectedAlgo(e.target.value as AlgoKey)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="orb">Opening Range Breakout</option>
                    <option value="sweep">Session Sweep Reclaim</option>
                    <option value="vwap">VWAP Reclaim</option>
                    <option value="pullback">Opening Pullback</option>
                    <option value="breakhold">Break and Hold</option>
                  </select>
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
                    onClick={handleCloseNow}
                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-500"
                  >
                    Close Position Now
                  </button>

                  {!killSwitch ? (
                    <button
                      onClick={handleKillSwitch}
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20"
                    >
                      Kill Switch
                    </button>
                  ) : (
                    <button
                      onClick={handleResetKillSwitch}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                    >
                      Reset Kill Switch
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-sm text-white/45">Signal Snapshot</p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/40">Entry</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {algoResult?.entry ?? "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/40">Stop</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {algoResult?.stop ?? "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/40">Target</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {algoResult?.target ?? "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/40">Signal</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {algoResult?.signal ?? "NONE"}
                  </p>
                </div>
              </div>

              {algoResult?.error ? (
                <p className="mt-3 text-sm text-red-400">{algoResult.error}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}