type Props = {
  active: boolean;
  onActivate: () => void;
  onReset: () => void;
  size?: "sm" | "md";
};

export default function KillSwitchButton({ active, onActivate, onReset, size = "md" }: Props) {
  const padding = size === "sm" ? "px-4 py-2" : "px-4 py-3";

  if (active) {
    return (
      <button
        onClick={onReset}
        className={`rounded-2xl border border-red-500/40 bg-red-500/10 text-sm font-semibold text-red-300 hover:bg-red-500/20 ${padding}`}
      >
        Reset Kill Switch
      </button>
    );
  }

  return (
    <button
      onClick={onActivate}
      className={`rounded-2xl bg-red-600 text-sm font-semibold hover:bg-red-500 ${padding}`}
    >
      Kill Switch
    </button>
  );
}
