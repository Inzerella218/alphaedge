import { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  valueClass?: string;
};

export default function MetricCard({ label, value, valueClass = "text-white" }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className={"mt-1 text-sm font-medium " + valueClass}>{value}</p>
    </div>
  );
}
