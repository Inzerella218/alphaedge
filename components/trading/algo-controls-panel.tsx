"use client";

import type { ExecutionMode } from "@/lib/types";

type Props = {
  pauseNewEntries: boolean;
  setPauseNewEntries: (v: boolean) => void;
  confirmBeforeSend: boolean;
  setConfirmBeforeSend: (v: boolean) => void;
  autoBrackets: boolean;
  setAutoBrackets: (v: boolean) => void;
  killSwitch: boolean;
  executionMode: ExecutionMode;
  maxDailyLoss: number;
};

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export default function AlgoControlsPanel({
  pauseNewEntries,
  setPauseNewEntries,
  confirmBeforeSend,
  setConfirmBeforeSend,
  autoBrackets,
  setAutoBrackets,
  killSwitch,
  executionMode,
  maxDailyLoss,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="mb-3 text-sm text-white/50">Algo Controls</p>
      <div className="space-y-3">
        <CheckRow
          label="Pause New Entries"
          checked={pauseNewEntries}
          onChange={setPauseNewEntries}
        />
        <CheckRow
          label="Confirm Before Send"
          checked={confirmBeforeSend}
          onChange={setConfirmBeforeSend}
        />
        <CheckRow
          label="Auto Brackets"
          checked={autoBrackets}
          onChange={setAutoBrackets}
        />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <p>Kill Switch: {killSwitch ? "ACTIVE" : "OFF"}</p>
          <p className="mt-1">Execution Mode: {executionMode.toUpperCase()}</p>
          <p className="mt-1">Max Daily Loss: ${maxDailyLoss}</p>
        </div>
      </div>
    </div>
  );
}
