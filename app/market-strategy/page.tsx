import AppShell from "@/components/app-shell";
import { marketModes } from "@/lib/market-modes";

const activeMode = marketModes[0];

export default function MarketStrategyPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-white/40">
          Analysis
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Market Strategy
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-white/60">
          Broad-market decision workspace for ETFs and futures, focused on day
          type classification, directional bias, open confirmation, and strategy
          selection.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {marketModes.map((mode, index) => (
          <button
            key={mode.id}
            className={`rounded-2xl px-5 py-3 text-sm font-medium ${
              index === 0
                ? "bg-white text-black"
                : "border border-white/10 bg-white/[0.04] text-white/80"
            }`}
          >
            {mode.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">{activeMode.name}</h3>
            <p className="mt-2 text-sm text-white/60">
              {activeMode.description}
            </p>

            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                Primary Focus
              </p>
              <div className="flex flex-wrap gap-2">
                {activeMode.focus.map((symbol) => (
                  <span
                    key={symbol}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                Key Signals
              </p>
              <div className="space-y-2">
                {activeMode.signals.map((signal) => (
                  <div
                    key={signal}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70"
                  >
                    {signal}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Strategy Summary</h3>

            <div className="mt-4 space-y-3 text-sm text-white/70">
              <p>Market Bias: Bullish</p>
              <p>Confidence: 62%</p>
              <p>Preferred Strategy: Opening Range Breakout</p>
              <p>Open Confirmation: Pending</p>
              <p>Execution Window: 8:35–10:00</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Market Structure View</h3>
              <button className="rounded-xl border border-white/10 px-3 py-2 text-sm">
                Send to Trading
              </button>
            </div>

            <div className="mt-4 flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-white/30">
              ETF / Futures chart workspace
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm text-white/50">SPY</p>
              <p className="mt-2 text-2xl font-semibold">Bullish</p>
              <p className="mt-1 text-sm text-white/60">Above VWAP</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm text-white/50">QQQ</p>
              <p className="mt-2 text-2xl font-semibold">Bullish</p>
              <p className="mt-1 text-sm text-white/60">Strong open setup</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm text-white/50">ES</p>
              <p className="mt-2 text-2xl font-semibold">Neutral</p>
              <p className="mt-1 text-sm text-white/60">Waiting on confirmation</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Morning Action Panel</h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button className="rounded-2xl bg-white px-4 py-3 font-medium text-black">
                Run Premarket Analysis
              </button>
              <button className="rounded-2xl border border-white/10 px-4 py-3">
                Run Open Confirmation
              </button>
              <button className="rounded-2xl border border-white/10 px-4 py-3">
                Push Focus to Trading
              </button>
              <button className="rounded-2xl border border-white/10 px-4 py-3">
                Save Day Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}