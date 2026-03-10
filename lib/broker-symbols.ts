export type BrokerSymbol = {
  symbol: string;
  name: string;
  type: "Stock" | "ETF" | "Futures";
};

export const brokerSymbols: BrokerSymbol[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "ETF" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", type: "ETF" },
  { symbol: "AAPL", name: "Apple Inc.", type: "Stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "Stock" },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "Stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "Stock" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", type: "Stock" },
  { symbol: "META", name: "Meta Platforms, Inc.", type: "Stock" },
  { symbol: "ES", name: "E-mini S&P 500 Futures", type: "Futures" },
  { symbol: "NQ", name: "E-mini Nasdaq-100 Futures", type: "Futures" },
];