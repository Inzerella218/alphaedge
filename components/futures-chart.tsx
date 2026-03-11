"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";

type AlgoResult = {
  algo?: string;
  signal?: string;
  entry?: number | null;
  stop?: number | null;
  target?: number | null;
  error?: string;
};

type Props = {
  symbol: string;
  timeframe: string;
  algoResult: AlgoResult | null;
};

type CandleBar = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export default function FuturesChart({ symbol, timeframe, algoResult }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState("Loading chart...");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    const chart = createChart(container, {
      layout: {
        textColor: "rgba(255,255,255,0.75)",
        background: { type: ColorType.Solid, color: "#0d121b" },
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.15)" },
        horzLine: { color: "rgba(255,255,255,0.15)" },
      },
      width: container.clientWidth,
      height: container.clientHeight,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f87171",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#f87171",
    });

    const vwapSeries = chart.addSeries(LineSeries, {
      color: "#60a5fa",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    candleSeriesRef.current = candleSeries;
    vwapSeriesRef.current = vwapSeries;

    const handleResize = () => {
      if (disposed || !chartRef.current || !containerRef.current) return;
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    const loadBars = async () => {
      if (disposed) return;

      try {
        setStatus("Loading chart...");

        const res = await fetch(
          "http://127.0.0.1:8010/market/candles?symbol=" +
            symbol +
            "&timeframe=" +
            encodeURIComponent(timeframe) +
            "&bars=240"
        );

        if (disposed) return;

        const data = await res.json();
        const bars: CandleBar[] = data.bars ?? [];

        const candleData = bars.map((bar) => ({
          time: Math.floor(new Date(bar.time).getTime() / 1000) as any,
          open: Number(bar.open),
          high: Number(bar.high),
          low: Number(bar.low),
          close: Number(bar.close),
        }));

        candleSeries.setData(candleData);

        let cumulativePV = 0;
        let cumulativeVol = 0;
        const vwapData = bars.map((bar) => {
          const typical =
            (Number(bar.high) + Number(bar.low) + Number(bar.close)) / 3;
          const vol = Number(bar.volume ?? 1);
          cumulativePV += typical * vol;
          cumulativeVol += vol;

          return {
            time: Math.floor(new Date(bar.time).getTime() / 1000) as any,
            value:
              cumulativeVol > 0
                ? cumulativePV / cumulativeVol
                : Number(bar.close),
          };
        });

        vwapSeries.setData(vwapData);

        chart.timeScale().fitContent();

        if (typeof algoResult?.entry === "number") {
          candleSeries.createPriceLine({
            price: algoResult.entry,
            color: "#10b981",
            lineWidth: 2,
            axisLabelVisible: true,
            title: "Entry",
          });
        }

        if (typeof algoResult?.stop === "number") {
          candleSeries.createPriceLine({
            price: algoResult.stop,
            color: "#f87171",
            lineWidth: 2,
            axisLabelVisible: true,
            title: "Stop",
          });
        }

        if (typeof algoResult?.target === "number") {
          candleSeries.createPriceLine({
            price: algoResult.target,
            color: "#60a5fa",
            lineWidth: 2,
            axisLabelVisible: true,
            title: "Target",
          });
        }

        setStatus("Live futures chart");
      } catch (error) {
        if (!disposed) {
          setStatus("Chart failed to load");
        }
      }
    };

    loadBars();
    refreshTimerRef.current = setInterval(loadBars, 5000);

    return () => {
      disposed = true;

      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      window.removeEventListener("resize", handleResize);

      vwapSeriesRef.current = null;
      candleSeriesRef.current = null;

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, timeframe]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (!candleSeries) return;

    if (typeof algoResult?.entry === "number") {
      candleSeries.createPriceLine({
        price: algoResult.entry,
        color: "#10b981",
        lineWidth: 2,
        axisLabelVisible: true,
        title: "Entry",
      });
    }

    if (typeof algoResult?.stop === "number") {
      candleSeries.createPriceLine({
        price: algoResult.stop,
        color: "#f87171",
        lineWidth: 2,
        axisLabelVisible: true,
        title: "Stop",
      });
    }

    if (typeof algoResult?.target === "number") {
      candleSeries.createPriceLine({
        price: algoResult.target,
        color: "#60a5fa",
        lineWidth: 2,
        axisLabelVisible: true,
        title: "Target",
      });
    }
  }, [algoResult?.entry, algoResult?.stop, algoResult?.target]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-white/10 bg-[#0d121b] p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">Futures Chart</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {symbol} · {timeframe}
          </p>
        </div>

        <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          {status}
        </div>
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10"
      />
    </div>
  );
}