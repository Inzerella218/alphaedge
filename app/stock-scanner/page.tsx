"use client"

import { useEffect, useMemo, useState } from "react"
import { fetchMarketData } from "@/lib/marketData"

type Stock = {
  ticker: string
  name?: string
  price: number
  gap: number
  premarketPrice?: number
  premarketPct?: number
  rvol: number
  float?: number
  vwap?: string
  volumeTrend?: string
  pattern?: string
  score: number
  signal?: string
  catalyst?: string
  newsAgeMinutes?: number | null
  hasNews?: boolean
  changePct?: number
  volume?: number
}

type ScannerResponse = {
  ok?: boolean
  rows?: Stock[]
  updatedAt?: number
  warning?: string
  source?: string
}

function getSignalLabel(stock: Stock) {
  if (stock.signal && stock.signal.trim().length > 0) return stock.signal
  if ((stock.score || 0) >= 25) return "A SETUP"
  if ((stock.score || 0) >= 12) return "B SETUP"
  return "WATCH"
}

function getSignalColor(signal: string) {
  if (signal === "A SETUP") return "text-green-400"
  if (signal === "B SETUP") return "text-yellow-400"
  return "text-red-400"
}

function getNumberColor(value: number) {
  if (value > 0) return "text-green-400"
  if (value < 0) return "text-red-400"
  return "text-white"
}

function getTradingViewUrl(ticker: string) {
  const symbol = encodeURIComponent(`NASDAQ:${ticker}`)
  return `https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=1&theme=dark&style=1&locale=en&toolbarbg=131722&hideideas=1`
}

function normalizeStock(row: any): Stock {
  const hasNews = Boolean(row?.hasNews)
  const score = Number(row?.score || 0)
  const gap = Number(row?.gap || row?.changePct || 0)
  const premarketPct = Number(row?.premarketPct || row?.changePct || 0)

  return {
    ticker: String(row?.ticker || ""),
    name: row?.name || row?.ticker || "",
    price: Number(row?.price || 0),
    gap,
    premarketPrice: Number(row?.premarketPrice || row?.price || 0),
    premarketPct,
    rvol: Number(row?.rvol || 0),
    float: Number(row?.float || 0),
    vwap: row?.vwap || "VWAP Watch",
    volumeTrend: row?.volumeTrend || (Number(row?.rvol || 0) >= 5 ? "Expanding" : "Normal"),
    pattern: row?.pattern || "Momentum",
    score,
    signal: row?.signal || (score >= 25 ? "A SETUP" : score >= 12 ? "B SETUP" : "WATCH"),
    catalyst: row?.catalyst || (hasNews ? "📰" : ""),
    newsAgeMinutes: row?.newsAgeMinutes ?? null,
    hasNews,
    changePct: Number(row?.changePct || 0),
    volume: Number(row?.volume || 0),
  }
}

export default function StockScannerPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [pinnedTickers, setPinnedTickers] = useState<string[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("alphaedge_pinned_tickers")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setPinnedTickers(parsed)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem("alphaedge_pinned_tickers", JSON.stringify(pinnedTickers))
  }, [pinnedTickers])

  function togglePin(ticker: string) {
    setPinnedTickers((current) => {
      if (current.includes(ticker)) {
        return current.filter((t) => t !== ticker)
      }
      return [ticker, ...current]
    })
  }

  async function loadData() {
    try {
      const raw = (await fetchMarketData()) as ScannerResponse | Stock[]
      const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.rows) ? raw.rows : []
      const data = rows.map(normalizeStock).filter((row) => row.ticker)

      if (data.length > 0) {
        setStocks((current) => {
          const currentMap = new Map(current.map((s) => [s.ticker, s]))
          const nextMap = new Map<string, Stock>()

          for (const row of data) {
            nextMap.set(row.ticker, row)
          }

          for (const ticker of pinnedTickers) {
            if (!nextMap.has(ticker) && currentMap.has(ticker)) {
              nextMap.set(ticker, currentMap.get(ticker)!)
            }
          }

          const merged = Array.from(nextMap.values())

          merged.sort((a, b) => {
            const aPinned = pinnedTickers.includes(a.ticker) ? 1 : 0
            const bPinned = pinnedTickers.includes(b.ticker) ? 1 : 0

            if (aPinned !== bPinned) return bPinned - aPinned
            if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0)
            if ((b.premarketPct || 0) !== (a.premarketPct || 0)) return (b.premarketPct || 0) - (a.premarketPct || 0)
            if ((b.gap || 0) !== (a.gap || 0)) return (b.gap || 0) - (a.gap || 0)
            return (b.rvol || 0) - (a.rvol || 0)
          })

          return merged
        })

        setError("")
        setLastUpdated(Date.now())

        setSelectedStock((current) => {
          if (!current) return data[0]
          return data.find((s: Stock) => s.ticker === current.ticker) ?? current
        })
      } else {
        setError("No scanner rows returned")
      }
    } catch {
      setError("Could not load scanner data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const interval = setInterval(() => {
      loadData()
    }, 4000)

    return () => clearInterval(interval)
  }, [pinnedTickers])

  const selected = useMemo(() => {
    if (!selectedStock) return null
    return stocks.find((s) => s.ticker === selectedStock.ticker) ?? selectedStock
  }, [stocks, selectedStock])

  const isSelectedPinned = selected ? pinnedTickers.includes(selected.ticker) : false

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-[38%] overflow-auto border-r border-gray-800 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Alpha Edge Momentum Scanner</h1>
            <p className="mt-1 text-xs text-gray-400">
              {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : "Waiting for first update..."}
            </p>
          </div>
          <button
            onClick={loadData}
            className="rounded bg-gray-800 px-3 py-2 hover:bg-gray-700"
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
              <th className="py-2">Day %</th>
              <th className="py-2">Premkt %</th>
              <th className="py-2">RVOL</th>
              <th className="py-2">Signal</th>
            </tr>
          </thead>

          <tbody>
            {stocks.map((stock) => {
              const isPinned = pinnedTickers.includes(stock.ticker)
              const signalLabel = getSignalLabel(stock)

              return (
                <tr
                  key={stock.ticker}
                  onClick={() => setSelectedStock(stock)}
                  className="cursor-pointer border-b border-gray-900 hover:bg-gray-900"
                >
                  <td className="py-3">
                    {isPinned ? "★ " : ""}
                    {stock.catalyst ? `${stock.catalyst} ` : ""}
                    {stock.ticker}
                  </td>
                  <td className="py-3">${Number(stock.price || 0).toFixed(2)}</td>
                  <td className={"py-3 " + getNumberColor(Number(stock.gap || 0))}>
                    {Number(stock.gap || 0).toFixed(2)}%
                  </td>
                  <td className={"py-3 " + getNumberColor(Number(stock.premarketPct || 0))}>
                    {Number(stock.premarketPct || 0).toFixed(2)}%
                  </td>
                  <td className="py-3">{Number(stock.rvol || 0).toFixed(2)}x</td>
                  <td className={"py-3 font-semibold " + getSignalColor(signalLabel)}>
                    {signalLabel}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="w-[37%] border-r border-gray-800 p-4">
        <div className="h-full overflow-hidden rounded-xl border border-gray-800 bg-[#131722]">
          {selected ? (
            <iframe
              key={selected.ticker}
              src={getTradingViewUrl(selected.ticker)}
              title={`TradingView chart for ${selected.ticker}`}
              className="h-full w-full"
              frameBorder="0"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Select a stock to load chart
            </div>
          )}
        </div>
      </div>

      <div className="w-[25%] overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Trade Panel</h2>

          {selected && (
            <button
              onClick={() => togglePin(selected.ticker)}
              className="rounded px-2 py-1 text-2xl leading-none hover:bg-gray-800"
              title={isSelectedPinned ? "Unpin stock" : "Pin stock"}
            >
              {isSelectedPinned ? "★" : "☆"}
            </button>
          )}
        </div>

        {!selected && <p>Select a stock to view trade details</p>}

        {selected && (
          <div className="space-y-3">
            <div className="text-lg font-bold">
              {selected.catalyst ? `${selected.catalyst} ` : ""}
              {selected.ticker}
            </div>

            {selected.name ? <div className="text-sm text-gray-400">{selected.name}</div> : null}

            <div>Price: ${Number(selected.price || 0).toFixed(2)}</div>
            <div className={getNumberColor(Number(selected.gap || 0))}>
              Day Change: {Number(selected.gap || 0).toFixed(2)}%
            </div>
            <div className={getNumberColor(Number(selected.premarketPct || 0))}>
              Premarket Change: {Number(selected.premarketPct || 0).toFixed(2)}%
            </div>
            <div>Premarket Price: ${Number(selected.premarketPrice || 0).toFixed(2)}</div>
            <div>RVOL: {Number(selected.rvol || 0).toFixed(2)}x</div>
            <div>Volume: {Number(selected.volume || 0).toLocaleString()}</div>
            <div>
              News Age: {selected.newsAgeMinutes != null ? `${selected.newsAgeMinutes}m` : selected.hasNews ? "Recent" : "-"}
            </div>
            <div>Pattern: {selected.pattern || "Momentum"}</div>
            <div>VWAP: {selected.vwap || "VWAP Watch"}</div>
            <div>Volume Trend: {selected.volumeTrend || "Normal"}</div>
            <div>Score: {Number(selected.score || 0).toFixed(2)}</div>
            <div className={getSignalColor(getSignalLabel(selected))}>
              Signal: {getSignalLabel(selected)}
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
          className="ml-2 px-1 text-black"
        />
      </div>

      <div>
        Entry:
        <input
          type="number"
          value={entry}
          disabled
          className="ml-2 px-1 text-black opacity-70"
        />
      </div>

      <div>
        Stop:
        <input
          type="number"
          value={stop}
          step="0.01"
          onChange={(e) => setStop(Number(e.target.value))}
          className="ml-2 px-1 text-black"
        />
      </div>

      <div>Risk/share: {riskPerShare.toFixed(2)}</div>
      <div>Shares: {shares}</div>
      <div>2R Target: {(entry + riskPerShare * 2).toFixed(2)}</div>
      <div>3R Target: {(entry + riskPerShare * 3).toFixed(2)}</div>
    </div>
  )
}