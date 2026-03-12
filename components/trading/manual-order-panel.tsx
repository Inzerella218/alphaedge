"use client";

import type { BrokerSymbol } from "@/lib/brokers/core/types";

type Props = {
  activeSymbol: BrokerSymbol | null;
  closeButtonLabel: string;
  onBuy: () => void;
  onSell: () => void;
  onCancelLatest: () => void;
  onClose: () => void;
  onFlattenAll: () => void;
};

export default function ManualOrderPanel({
  activeSymbol,
  closeButtonLabel,
  onBuy,
  onSell,
  onCancelLatest,
  onClose,
  onFlattenAll,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="mb-3 text-sm text-white/50">Manual Order Entry</p>

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        Active Symbol: {activeSymbol?.symbol ?? "None"}
      </div>

      <div className="grid gap-2">
        <button
          onClick={onBuy}
          className="rounded-xl bg-green-600 py-2 font-medium hover:bg-green-500"
        >
          Buy Market
        </button>
        <button
          onClick={onSell}
          className="rounded-xl bg-red-600 py-2 font-medium hover:bg-red-500"
        >
          Sell Market
        </button>
        <button className="rounded-xl border border-white/10 py-2">Buy Limit</button>
        <button className="rounded-xl border border-white/10 py-2">Sell Limit</button>
        <button onClick={onCancelLatest} className="rounded-xl border border-white/10 py-2">
          Cancel Latest Order
        </button>
        <button
          onClick={onClose}
          className="rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-red-200 hover:bg-red-500/20"
        >
          {closeButtonLabel}
        </button>
        <button
          onClick={onFlattenAll}
          className="rounded-xl border border-orange-500/30 bg-orange-500/10 py-2 text-orange-200"
        >
          Flatten All
        </button>
      </div>
    </div>
  );
}
