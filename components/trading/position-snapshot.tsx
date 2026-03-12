"use client";

import SectionCard from "@/components/ui/section-card";
import MetricCard from "@/components/ui/metric-card";
import type { BrokerPosition } from "@/lib/brokers/core/types";

type Props = {
  lastPosition: BrokerPosition | null;
};

export default function PositionSnapshot({ lastPosition }: Props) {
  return (
    <SectionCard title="Position Snapshot">
      <div className="grid gap-3">
        <MetricCard
          label="Current Position"
          value={lastPosition ? lastPosition.symbol : "Flat"}
        />
        <MetricCard
          label="Quantity"
          value={lastPosition ? String(lastPosition.quantity) : "0"}
        />
        <MetricCard
          label="Average Price"
          value={lastPosition ? "$" + lastPosition.averagePrice : "-"}
        />
        <MetricCard
          label="Unrealized P&L"
          value={lastPosition ? "$" + (lastPosition.unrealizedPnL ?? 0) : "$0"}
        />
      </div>
    </SectionCard>
  );
}
