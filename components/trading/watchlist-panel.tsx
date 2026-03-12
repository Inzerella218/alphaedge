"use client";

import SectionCard from "@/components/ui/section-card";
import type { BrokerConnectionStatus, BrokerSymbol } from "@/lib/brokers/core/types";

type Props = {
  brokerStatus: BrokerConnectionStatus;
  isLoadingSymbols: boolean;
  filteredSymbols: BrokerSymbol[];
  activeSymbol: BrokerSymbol | null;
  onSelect: (s: BrokerSymbol) => void;
  search: string;
  setSearch: (v: string) => void;
};

export default function WatchlistPanel({
  brokerStatus,
  isLoadingSymbols,
  filteredSymbols,
  activeSymbol,
  onSelect,
  search,
  setSearch,
}: Props) {
  return (
    <SectionCard title="Watchlist">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search symbols..."
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
      />

      <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {isLoadingSymbols && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
            Loading symbols...
          </div>
        )}

        {!isLoadingSymbols && brokerStatus !== "connected" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
            Connect a broker to load symbols.
          </div>
        )}

        {!isLoadingSymbols &&
          brokerStatus === "connected" &&
          filteredSymbols.map((item) => {
            const isActive = item.symbol === activeSymbol?.symbol;
            return (
              <button
                key={item.symbol}
                onClick={() => onSelect(item)}
                className={
                  "w-full rounded-2xl border px-4 py-3 text-left transition " +
                  (isActive
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10")
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.symbol}</span>
                  <span className={"text-xs " + (isActive ? "text-black/60" : "text-white/40")}>
                    {item.type}
                  </span>
                </div>
                <p className={"mt-1 text-xs " + (isActive ? "text-black/70" : "text-white/50")}>
                  {item.name}
                </p>
              </button>
            );
          })}

        {!isLoadingSymbols &&
          brokerStatus === "connected" &&
          filteredSymbols.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
              No symbols found.
            </div>
          )}
      </div>
    </SectionCard>
  );
}
