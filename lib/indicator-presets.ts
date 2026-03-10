export type IndicatorPreset = {
  id: string;
  name: string;
  indicators: string[];
};

export const indicatorPresets: IndicatorPreset[] = [
  {
    id: "market-sentiment",
    name: "Market Sentiment",
    indicators: [
      "VWAP",
      "9 EMA",
      "20 EMA",
      "Volume",
      "Opening Range",
      "Premarket High/Low",
    ],
  },
  {
    id: "stock-scanner",
    name: "Stock Scanner",
    indicators: [
      "VWAP",
      "9 EMA",
      "Volume",
      "Relative Volume",
      "High of Day",
      "Low of Day",
    ],
  },
  {
    id: "opening-range",
    name: "Opening Range",
    indicators: [
      "Opening Range",
      "VWAP",
      "9 EMA",
      "20 EMA",
      "Volume",
    ],
  },
];