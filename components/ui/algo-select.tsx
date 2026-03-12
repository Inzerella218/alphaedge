import type { AlgoKey } from "@/lib/types";

type Props = {
  value: AlgoKey;
  onChange: (v: AlgoKey) => void;
  className?: string;
};

const ALGO_OPTIONS: { value: AlgoKey; label: string }[] = [
  { value: "orb", label: "Opening Range Breakout" },
  { value: "sweep", label: "Session Sweep Reclaim" },
  { value: "vwap", label: "VWAP Reclaim" },
  { value: "pullback", label: "Opening Pullback" },
  { value: "breakhold", label: "Break and Hold" },
];

export default function AlgoSelect({ value, onChange, className = "" }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AlgoKey)}
      className={"rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none " + className}
    >
      {ALGO_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
