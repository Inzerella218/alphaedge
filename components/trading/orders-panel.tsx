"use client";

import SectionCard from "@/components/ui/section-card";
import type { BrokerOrder } from "@/lib/brokers/core/types";

type Props = {
  orders: BrokerOrder[];
  orderMessage: string;
};

export default function OrdersPanel({ orders, orderMessage }: Props) {
  return (
    <SectionCard title="Orders">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        {orderMessage}
      </div>

      <div className="mt-4 grid max-h-[280px] gap-3 overflow-y-auto pr-1">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
            No orders yet.
          </div>
        ) : (
          orders.slice(0, 6).map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">
                  {order.side.toUpperCase()} {order.symbol}
                </p>
                <p className="text-white/40">{order.status}</p>
              </div>
              <p className="mt-2">Type: {order.orderType}</p>
              <p>Quantity: {order.quantity}</p>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
