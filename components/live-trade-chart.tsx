"use client";

import { useEffect, useMemo, useState } from "react";

type BiasState = "Bullish" | "Bearish" | "Neutral";
type PressureState = "Buyers in Control" | "Sellers in Control" | "Balanced";

type AlgoResult = {
  algo?: string;
  signal?: string;
  entry?: number | null;
  stop?: number | null;
  target?: number | null;
};

type Props = {
  symbol: string;
  bias: BiasState;
  pressure: PressureState;
  algoResult: AlgoResult | null;
};

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
};

function makeSeededCandles(seed: number, direction: "up" | "down" | "flat"): Candle[] {
  const candles: Candle[] = [];
  let price = seed;

  for (let i = 0; i < 36; i++) {
    const drift =
      direction === "up" ? 1.2 : direction === "down" ? -1.2 : i % 2 === 0 ? 0.5 : -0.5;

    const noise = ((i * 7) % 5) - 2;
    const open = price;
    const close = Math.max(10, open + drift + noise * 0.35);
    const high = Math.max(open, close) + 1.4 + (i % 3) * 0.35;
    const low = Math.min(open, close) - 1.2 - (i % 2) * 0.4;

    candles.push({
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    price = close;
  }

  return candles;
}

export default function LiveTradeChart({ symbol, bias, pressure, algoResult }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  const direction =
    bias === "Bullish" ? "up" : bias === "Bearish" ? "down" : "flat";

  const candles = useMemo(() => {
    const base =
      symbol === "ES" ? 5280 :
      symbol === "MES" ? 5280 :
      symbol === "NQ" ? 18840 :
      symbol === "SPY" ? 590 :
      100;

    const baseCandles = makeSeededCandles(base, direction);

    const next = [...baseCandles];
    const last = next[next.length - 1];
    const pulse = pressure === "Buyers in Control" ? 1.4 : pressure === "Sellers in Control" ? -1.4 : 0.2;
    const micro = ((tick % 5) - 2) * 0.18;

    const open = last.close;
    const close = Math.max(10, open + pulse + micro);
    const high = Math.max(open, close) + 1.1;
    const low = Math.min(open, close) - 1.1;

    next.shift();
    next.push({
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    return next;
  }, [symbol, direction, pressure, tick]);

  const minPrice = Math.min(...candles.map((c) => c.low));
  const maxPrice = Math.max(...candles.map((c) => c.high));
  const range = Math.max(maxPrice - minPrice, 1);

  const chartHeight = 420;
  const chartWidth = 1000;
  const candleGap = chartWidth / candles.length;
  const candleBodyWidth = Math.max(6, candleGap * 0.55);

  const yForPrice = (price: number) => {
    const normalized = (price - minPrice) / range;
    return chartHeight - normalized * chartHeight;
  };

  const lastClose = candles[candles.length - 1]?.close ?? 0;
  const entryLine = typeof algoResult?.entry === "number" ? algoResult.entry : null;
  const stopLine = typeof algoResult?.stop === "number" ? algoResult.stop : null;
  const targetLine = typeof algoResult?.target === "number" ? algoResult.target : null;
  const vwapLine = Number((candles.reduce((sum, c) => sum + c.close, 0) / candles.length).toFixed(2));
  const openingHigh = Math.max(...candles.slice(0, 6).map((c) => c.high));
  const openingLow = Math.min(...candles.slice(0, 6).map((c) => c.low));

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/40">Custom live chart</p>
          <p className="mt-1 text-lg font-semibold text-white">{symbol}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 animate-pulse">
            LIVE
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            {bias}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)] p-4">
        <div className="relative h-full min-h-0 w-full">
          <svg viewBox={"0 0 " + chartWidth + " " + chartHeight} className="h-full w-full">
            {[0.2, 0.4, 0.6, 0.8].map((f) => (
              <line
                key={f}
                x1="0"
                x2={chartWidth}
                y1={chartHeight * f}
                y2={chartHeight * f}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 6"
              />
            ))}

            <line
              x1="0"
              x2={chartWidth}
              y1={yForPrice(vwapLine)}
              y2={yForPrice(vwapLine)}
              stroke="rgba(96,165,250,0.75)"
              strokeWidth="2"
            />

            <line
              x1="0"
              x2={chartWidth}
              y1={yForPrice(openingHigh)}
              y2={yForPrice(openingHigh)}
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="1.5"
            />

            <line
              x1="0"
              x2={chartWidth}
              y1={yForPrice(openingLow)}
              y2={yForPrice(openingLow)}
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="1.5"
            />

            {entryLine !== null && (
              <line
                x1="0"
                x2={chartWidth}
                y1={yForPrice(entryLine)}
                y2={yForPrice(entryLine)}
                stroke="rgba(16,185,129,0.95)"
                strokeWidth="2.5"
              />
            )}

            {stopLine !== null && (
              <line
                x1="0"
                x2={chartWidth}
                y1={yForPrice(stopLine)}
                y2={yForPrice(stopLine)}
                stroke="rgba(248,113,113,0.95)"
                strokeWidth="2.5"
              />
            )}

            {targetLine !== null && (
              <line
                x1="0"
                x2={chartWidth}
                y1={yForPrice(targetLine)}
                y2={yForPrice(targetLine)}
                stroke="rgba(59,130,246,0.95)"
                strokeWidth="2.5"
              />
            )}

            {candles.map((candle, i) => {
              const x = i * candleGap + candleGap / 2;
              const bullish = candle.close >= candle.open;
              const bodyTop = yForPrice(Math.max(candle.open, candle.close));
              const bodyBottom = yForPrice(Math.min(candle.open, candle.close));
              const wickTop = yForPrice(candle.high);
              const wickBottom = yForPrice(candle.low);

              return (
                <g key={i}>
                  <line
                    x1={x}
                    x2={x}
                    y1={wickTop}
                    y2={wickBottom}
                    stroke={bullish ? "rgba(16,185,129,0.9)" : "rgba(248,113,113,0.9)"}
                    strokeWidth="2"
                  />
                  <rect
                    x={x - candleBodyWidth / 2}
                    y={bodyTop}
                    width={candleBodyWidth}
                    height={Math.max(4, bodyBottom - bodyTop)}
                    rx="2"
                    fill={bullish ? "rgba(16,185,129,0.9)" : "rgba(248,113,113,0.9)"}
                  />
                </g>
              );
            })}

            <circle
              cx={chartWidth - candleGap / 2}
              cy={yForPrice(lastClose)}
              r="5"
              fill={bias === "Bullish" ? "rgba(16,185,129,1)" : bias === "Bearish" ? "rgba(248,113,113,1)" : "rgba(250,204,21,1)"}
            />
          </svg>

          <div className="pointer-events-none absolute left-3 top-3 space-y-2">
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70">
              VWAP {vwapLine}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70">
              OR High {openingHigh.toFixed(2)}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70">
              OR Low {openingLow.toFixed(2)}
            </div>
          </div>

          <div className="pointer-events-none absolute right-3 top-3 space-y-2 text-right">
            {entryLine !== null && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Entry {entryLine}
              </div>
            )}
            {stopLine !== null && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                Stop {stopLine}
              </div>
            )}
            {targetLine !== null && (
              <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                Target {targetLine}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}