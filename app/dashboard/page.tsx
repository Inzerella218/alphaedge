import Link from "next/link";
import AppShell from "@/components/app-shell";
import PageHeader from "@/components/page-header";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Morning command center for market regime, bias, strategy selection, and execution readiness."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg">
          <p className="text-sm text-white/50">Market Regime</p>
          <p className="mt-3 text-2xl font-semibold">Momentum Candidate</p>
          <p className="text-sm text-white/60">Premarket hypothesis</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg">
          <p className="text-sm text-white/50">Directional Bias</p>
          <p className="mt-3 text-2xl font-semibold text-blue-400">Bullish</p>
          <p className="text-sm text-white/60">Confidence 62%</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg">
          <p className="text-sm text-white/50">Market Focus</p>
          <p className="mt-3 text-2xl font-semibold">SPY / QQQ / ES</p>
          <p className="text-sm text-white/60">Primary instruments</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg">
          <p className="text-sm text-white/50">Scanner</p>
          <p className="mt-3 text-2xl font-semibold">Momentum Stocks</p>
          <p className="text-sm text-white/60">High demand / low supply</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg xl:col-span-2">
          <h3 className="text-lg font-semibold">Session Controls</h3>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button className="rounded-2xl bg-blue-600 hover:bg-blue-500 transition px-4 py-3 font-medium">
              Run Premarket Analysis
            </button>

            <Link
              href="/trading"
              className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3 text-center"
            >
              Open Trading Workspace
            </Link>

            <Link
              href="/market-strategy"
              className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3 text-center"
            >
              Market Strategy
            </Link>

            <Link
              href="/stock-scanner"
              className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3 text-center"
            >
              Stock Scanner
            </Link>

            <Link
              href="/algo-lab"
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition px-4 py-3 font-medium text-center md:col-span-2"
            >
              Open Algo Lab
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg">
          <h3 className="text-lg font-semibold">Risk Snapshot</h3>

          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>Risk per trade: $300</p>
            <p>Max daily loss: $1000</p>
            <p>Execution window: 8:35-10:00</p>
            <p>Mode: Paper</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur p-6 shadow-lg">
          <p className="text-sm text-emerald-300/80">Algo 01</p>
          <h3 className="mt-2 text-xl font-semibold">Opening Range Breakout</h3>
          <p className="mt-2 text-sm text-white/70">
            Trades confirmed breaks of the opening range during your morning execution window.
          </p>
          <div className="mt-4 text-sm text-white/60 space-y-1">
            <p>Status: Ready for integration</p>
            <p>Market: SPY / QQQ / ES / MES</p>
            <p>Use case: Momentum open</p>
          </div>
        </div>

        <div className="rounded-3xl border border-orange-500/20 bg-orange-500/10 backdrop-blur p-6 shadow-lg">
          <p className="text-sm text-orange-300/80">Algo 02</p>
          <h3 className="mt-2 text-xl font-semibold">Session Sweep Reclaim</h3>
          <p className="mt-2 text-sm text-white/70">
            Looks for sweeps above highs or below lows, then enters on reclaim back through the level.
          </p>
          <div className="mt-4 text-sm text-white/60 space-y-1">
            <p>Status: Ready for integration</p>
            <p>Market: ES / MES / SPY / QQQ</p>
            <p>Use case: Failed breakout / liquidity grab</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}