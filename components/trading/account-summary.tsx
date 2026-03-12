"use client";

import MetricCard from "@/components/ui/metric-card";
import type { BrokerAccount } from "@/lib/brokers/core/types";

type Props = {
  account: BrokerAccount | null;
};

export default function AccountSummary({ account }: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="mb-3 text-sm text-white/50">Account Summary</p>
      {account ? (
        <div className="space-y-3">
          <MetricCard label="Account" value={account.accountName} />
          <MetricCard
            label="Buying Power"
            value={"$" + (account.buyingPower?.toLocaleString() ?? "0")}
          />
          <MetricCard
            label="Net Liquidation"
            value={"$" + (account.netLiquidation?.toLocaleString() ?? "0")}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Connect a broker to load account data.
        </div>
      )}
    </div>
  );
}
