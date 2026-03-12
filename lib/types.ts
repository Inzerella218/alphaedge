export type AlgoKey = "orb" | "sweep" | "vwap" | "pullback" | "breakhold";

export type ExecutionMode = "paper" | "live";

export type AlgoResult = {
  algo?: string;
  signal?: string;
  entry?: number | null;
  stop?: number | null;
  target?: number | null;
  risk?: number;
  symbol?: string;
  error?: string;
  why?: string[];
};
