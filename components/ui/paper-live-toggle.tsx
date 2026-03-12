import type { ExecutionMode } from "@/lib/types";

type Props = {
  value: ExecutionMode;
  onChange: (v: ExecutionMode) => void;
};

export default function PaperLiveToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
      {(["paper", "live"] as ExecutionMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={
            "flex-1 rounded-xl px-4 py-2 text-sm " +
            (value === mode ? "bg-white text-black" : "text-white/70")
          }
        >
          {mode === "paper" ? "Paper" : "Live"}
        </button>
      ))}
    </div>
  );
}
