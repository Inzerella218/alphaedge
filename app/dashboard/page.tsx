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

            <button className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3">
              Open Trading Workspace
            </button>

            <button className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3">
              Market Strategy
            </button>

            <button className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3">
              Stock Scanner
            </button>

          </div>

        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-6 shadow-lg">

          <h3 className="text-lg font-semibold">Risk Snapshot</h3>

          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>Risk per trade: $300</p>
            <p>Max daily loss: $1000</p>
            <p>Execution window: 8:35–10:00</p>
            <p>Mode: Paper</p>
          </div>

        </div>

      </div>

    </AppShell>
  );
}