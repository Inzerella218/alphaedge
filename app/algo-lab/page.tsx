"use client";

import { useState } from "react";
import AppShell from "@/components/app-shell";
import PageHeader from "@/components/page-header";

type AlgoKey = "orb" | "sweep" | "vwap" | "pullback" | "breakhold";

export default function AlgoLabPage() {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgoKey>("orb");
  const [symbol, setSymbol] = useState("MES");
  const [risk, setRisk] = useState(300);
  const [result, setResult] = useState<any>(null);

      const runBacktest = async () => {
    try {
      setResult({ loading: true });

      const res = await fetch(
        `http://127.0.0.1:8010/algo/test?algo=${selectedAlgo}&symbol=${symbol}&risk=${risk}`
      );

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Backend connection failed." });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Algo Lab"
        description="Build, test, and control AlphaEdge strategies from one screen."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg xl:col-span-2">
          <h3 className="text-lg font-semibold">Strategy Controls</h3>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white/60">Algorithm</label>
              <select
                value={selectedAlgo}
                onChange={(e) => setSelectedAlgo(e.target.value as AlgoKey)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              >
                <option value="orb">Opening Range Breakout</option>
                <option value="sweep">Session Sweep Reclaim</option>
                <option value="vwap">VWAP Reclaim</option>
                <option value="pullback">Opening Pullback</option>
                <option value="breakhold">Break and Hold</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">Symbol</label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder="MES"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">Risk Per Trade ($)</label>
              <input
                type="number"
                value={risk}
                onChange={(e) => setRisk(Number(e.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={runBacktest}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition px-4 py-3 font-medium"
              >
                Run Test
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-white/50">Test Output</p>

            {!result && (
              <p className="mt-2 text-sm text-white/70">No test run yet.</p>
            )}

            {result?.loading && (
              <p className="mt-2 text-sm text-white/70">Running test...</p>
            )}

            {result?.error && (
              <p className="mt-2 text-sm text-red-400">{result.error}</p>
            )}

            {result && !result.loading && !result.error && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Algorithm</p>
                  <p className="mt-1 text-sm font-medium text-white">{result.algo}</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Signal</p>
                  <p className="mt-1 text-sm font-medium text-emerald-400">{result.signal}</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Symbol</p>
                  <p className="mt-1 text-sm font-medium text-white">{result.symbol}</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Risk</p>
                  <p className="mt-1 text-sm font-medium text-white">${result.risk}</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Entry</p>
                  <p className="mt-1 text-sm font-medium text-white">{result.entry ?? "-"}</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Stop</p>
                  <p className="mt-1 text-sm font-medium text-red-400">{result.stop ?? "-"}</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4 md:col-span-2">
                  <p className="text-xs text-white/50">Target</p>
                  <p className="mt-1 text-sm font-medium text-blue-400">{result.target ?? "-"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg">
          <h3 className="text-lg font-semibold">Loaded Strategies</h3>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-300">Opening Range Breakout</p>
              <p className="mt-1 text-sm text-white/70">
                Best for momentum opens and continuation.
              </p>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
              <p className="text-sm text-orange-300">Session Sweep Reclaim</p>
              <p className="mt-1 text-sm text-white/70">
                Best for failed breakouts and liquidity sweeps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}