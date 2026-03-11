"use client"

import { useEffect, useMemo, useState } from "react"
import { fetchMarketData } from "@/lib/marketData"

type Stock = {
  ticker: string
  price: number
  gap: number
  rvol: number
  float: number
  vwap: string
  volumeTrend: string
  pattern: string
  score: number
  signal: string
  catalyst: string
}

function getSignalColor(signal: string) {
  if (signal === "BUY") return "text-green-400"
  if (signal === "WAIT") return "text-yellow-400"
  return "text-red-400"
}

export default function StockScannerPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      setLoading(true)
      const data = await fetchMarketData()
      setStocks(data)
      setError("")

      if (data.length > 0) {
        setSelectedStock((current) => current ?? data[0])
      }
    } catch (err) {
      setError("Could not load scanner data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const interval = setInterval(() => {
      loadData()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const selected = useMemo(() => {
    if (!selectedStock) return null
    return stocks.find((s) => s.ticker === selectedStock.ticker) ?? selectedStock
  }, [stocks, selectedStock])

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-2/3 p-6 border-r border-gray-800 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Alpha Edge Momentum Scanner</h1>
          <button
            onClick={loadData}
            className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="mb-4 text-gray-400">Loading scanner...</p>}
        {error && <p className="mb-4 text-red-400">{error}</p>}

        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="py-2">Ticker</th>
              <th className="py-2">Price</th>
              <th className="py-2">Gap%</th>
              <th className="py-2">RVOL</th>
              <th className="py-2">Float(M)</th>
              <th className="py-2">VWAP</th>
              <th className="py-2">Volume</th>
              <th className="py-2">Pattern</th>
              <th className="py-2">Score</th>
              <th className="py-2">Signal</th>
            </tr>
          </thead>

          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.ticker}
                onClick={() => setSelectedStock(stock)}
                className="border-b border-gray-900 cursor-pointer hover:bg-gray-900"
              >
                <td className="py-3">
                  {stock.catalyst} {stock.ticker}
                </td>
                <td className="py-3">${Number(stock.price || 0).toFixed(2)}</td>
                <td className="py-3">{stock.gap}%</td>
                <td className="py-3">{stock.rvol}x</td>
                <td className="py-3">{stock.float}</td>
                <td className="py-3">{stock.vwap}</td>
                <td className="py-3">{stock.volumeTrend}</td>
                <td className="py-3">{stock.pattern}</td>
                <td className="py-3">{stock.score}</td>
                <td className={"py-3 " + getSignalColor(stock.signal)}>
                  {stock.signal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="w-1/3 p-6">
        <h2 className="text-xl font-bold mb-4">Trade Panel</h2>

        {!selected && <p>Select a stock to view trade details</p>}

        {selected && (
          <div className="space-y-3">
            <div className="text-lg font-bold">{selected.ticker}</div>
            <div>Price: ${Number(selected.price || 0).toFixed(2)}</div>
            <div>Pattern: {selected.pattern}</div>
            <div>Score: {selected.score}</div>
            <div className={getSignalColor(selected.signal)}>
              Signal: {selected.signal}
            </div>

            <hr className="border-gray-700" />

            <TradeCalculator price={Number(selected.price || 0)} />
          </div>
        )}
      </div>
    </div>
  )
}

function TradeCalculator({ price }: { price: number }) {
  const entry = price > 0 ? price : 1
  const [risk, setRisk] = useState(300)
  const [stop, setStop] = useState(entry > 0.2 ? entry - 0.2 : 0.8)

  const riskPerShare = Math.max(entry - stop, 0.01)
  const shares = Math.floor(risk / riskPerShare)

  return (
    <div className="space-y-2">
      <div className="font-bold">Position Calculator</div>

      <div>
        Risk ($):
        <input
          type="number"
          value={risk}
          onChange={(e) => setRisk(Number(e.target.value))}
          className="ml-2 text-black px-1"
        />
      </div>

      <div>
        Entry:
        <input
          type="number"
          value={entry}
          disabled
          className="ml-2 text-black px-1 opacity-70"
        />
      </div>

      <div>
        Stop:
        <input
          type="number"
          value={stop}
          step="0.01"
          onChange={(e) => setStop(Number(e.target.value))}
          className="ml-2 text-black px-1"
        />
      </div>

      <div>Risk/share: {riskPerShare.toFixed(2)}</div>
      <div>Shares: {shares}</div>
      <div>2R Target: {(entry + riskPerShare * 2).toFixed(2)}</div>
      <div>3R Target: {(entry + riskPerShare * 3).toFixed(2)}</div>
    </div>
  )
}
