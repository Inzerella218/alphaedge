"use client";

import SectionCard from "@/components/ui/section-card";
import type { BrokerConnectionStatus, BrokerType } from "@/lib/brokers/core/types";

type Props = {
  selectedBrokerType: BrokerType;
  onSelectBroker: (t: BrokerType) => void;
  brokerStatus: BrokerConnectionStatus;
  statusMessage: string;
  onConnect: () => void;
  onDisconnect: () => void;
};

export default function BrokerPanel({
  selectedBrokerType,
  onSelectBroker,
  brokerStatus,
  statusMessage,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <SectionCard title="Broker">
      <div className="flex flex-wrap gap-2">
        {(["ibkr", "webull"] as BrokerType[]).map((type) => (
          <button
            key={type}
            onClick={() => onSelectBroker(type)}
            className={
              "rounded-xl px-4 py-2 text-sm " +
              (selectedBrokerType === type
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/80")
            }
          >
            {type === "ibkr" ? "IBKR" : "Webull"}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <p>Status: {brokerStatus}</p>
        <p className="mt-1 text-white/50">{statusMessage}</p>
      </div>

      <div className="mt-4 grid gap-2">
        <button onClick={onConnect} className="rounded-xl bg-white py-2 font-medium text-black">
          Connect Broker
        </button>
        <button onClick={onDisconnect} className="rounded-xl border border-white/10 py-2">
          Disconnect Broker
        </button>
      </div>
    </SectionCard>
  );
}
