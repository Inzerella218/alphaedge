"use client";

import SectionCard from "@/components/ui/section-card";
import type { AlgoResult } from "@/lib/types";

type Props = {
  isRunningAlgo: boolean;
  algoResult: AlgoResult | null;
  riskPerTrade: number;
  onCheck: () => void;
  onPause: () => void;
};

export default function AlgoSignalPanel({
  isRunningAlgo,
  algoResult,
  riskPerTrade,
  onCheck,
  onPause,
}: Props) {
  return (
    <SectionCard title="Algo Signal">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        {isRunningAlgo ? (
          <p className="text-sm text-white/60">Checking signal...</p>
        ) : algoResult?.error ? (
          <p className="text-sm text-red-400">{algoResult.error}</p>
        ) : algoResult ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: "Signal", value: algoResult.signal ?? "-", cls: "text-emerald-400" },
              { label: "Algorithm", value: algoResult.algo ?? "-", cls: "text-white" },
              { label: "Entry", value: String(algoResult.entry ?? "-"), cls: "text-white" },
              { label: "Risk", value: "$" + (algoResult.risk ?? riskPerTrade), cls: "text-white" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-white/40">{label}</p>
                <p className={"mt-1 text-sm font-medium " + cls}>{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/60">
            No signal loaded yet. Run a check when you are ready.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        <button
          onClick={onCheck}
          className="rounded-xl bg-emerald-600 py-2 font-medium hover:bg-emerald-500"
        >
          Check Signal
        </button>
        <button onClick={onPause} className="rounded-xl border border-white/10 py-2">
          Pause New Entries
        </button>
      </div>
    </SectionCard>
  );
}
