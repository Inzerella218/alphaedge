export type MarketMode = {
  id: string;
  name: string;
  description: string;
  focus: string[];
  signals: string[];
};

export const marketModes: MarketMode[] = [
  {
    id: "auto-detect",
    name: "Auto Detect",
    description:
      "System evaluates premarket and open conditions to determine the most probable session structure.",
    focus: ["SPY", "QQQ", "ES", "NQ"],
    signals: [
      "Opening Range",
      "VWAP",
      "Trend Strength",
      "Volume Expansion",
      "Gap Hold / Fade",
    ],
  },
  {
    id: "trend-day",
    name: "Trend Day",
    description:
      "Bias toward continuation and directional movement with strong participation.",
    focus: ["SPY", "QQQ", "ES"],
    signals: [
      "Higher Highs / Higher Lows",
      "VWAP Hold",
      "EMA Stack",
      "Strong Breadth",
    ],
  },
  {
    id: "range-day",
    name: "Range / Chop",
    description:
      "Bias toward failed breakouts, rejections, and shorter-duration moves inside a range.",
    focus: ["SPY", "QQQ"],
    signals: [
      "VWAP Reversion",
      "Range High / Low",
      "Low Trend Strength",
      "Fade Setups",
    ],
  },
  {
    id: "mean-reversion",
    name: "Mean Reversion",
    description:
      "Focus on stretched moves returning back toward VWAP or core intraday averages.",
    focus: ["SPY", "QQQ", "NQ"],
    signals: [
      "Extended Move",
      "VWAP Pullback",
      "Volume Exhaustion",
      "Reversion Trigger",
    ],
  },
];