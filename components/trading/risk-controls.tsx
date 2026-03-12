"use client";

import SectionCard from "@/components/ui/section-card";

type Props = {
  quantity: number;
  setQuantity: (v: number) => void;
  riskPerTrade: number;
  setRiskPerTrade: (v: number) => void;
  maxDailyLoss: number;
  setMaxDailyLoss: (v: number) => void;
};

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </label>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
      />
    </div>
  );
}

export default function RiskControls({
  quantity,
  setQuantity,
  riskPerTrade,
  setRiskPerTrade,
  maxDailyLoss,
  setMaxDailyLoss,
}: Props) {
  return (
    <SectionCard title="Risk Controls">
      <div className="space-y-3">
        <NumberInput label="Quantity" value={quantity} onChange={setQuantity} />
        <NumberInput label="Risk Per Trade" value={riskPerTrade} onChange={setRiskPerTrade} />
        <NumberInput label="Max Daily Loss" value={maxDailyLoss} onChange={setMaxDailyLoss} />
      </div>
    </SectionCard>
  );
}
