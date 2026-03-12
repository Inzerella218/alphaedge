"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";

type EconEvent = {
  date: string;
  time: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  currency: string;
  note: string;
  status?: "upcoming" | "current" | "past";
  statusLabel?: string;
};

type DayPressure = {
  level: "High" | "Medium" | "Low";
  label: string;
  color: "red" | "yellow" | "green";
  summary: string;
};

type EarningsItem = {
  ticker: string;
  name: string;
  timing: string;
  timingCode: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
};

type HeadlineItem = {
  id: string;
  source: string;
  handle: string;
  text: string;
  timestamp: string;
  marketRelevant: boolean;
};

function relativeTime(iso: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}

const pressureStyles = {
  red: {
    banner: "border-red-500/30 bg-red-500/10",
    dot: "bg-red-400",
    label: "text-red-300",
  },
  yellow: {
    banner: "border-yellow-500/30 bg-yellow-500/10",
    dot: "bg-yellow-400",
    label: "text-yellow-300",
  },
  green: {
    banner: "border-emerald-500/30 bg-emerald-500/10",
    dot: "bg-emerald-400",
    label: "text-emerald-300",
  },
};

function EconCalendarPanel() {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [pressure, setPressure] = useState<DayPressure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8010/market/calendar")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? []);
        setPressure(d.pressure ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ps = pressure ? pressureStyles[pressure.color] : pressureStyles.green;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-white/12 bg-[#0b0f18] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Economic Calendar</h3>
        <span className="rounded-md border border-white/12 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
          High impact only
        </span>
      </div>

      {pressure && (
        <div className={`mb-2 rounded-lg border px-3 py-2 ${ps.banner}`}>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${ps.dot}`} />
            <span className={`text-sm font-semibold ${ps.label}`}>{pressure.label}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-white/55">{pressure.summary}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg border border-white/12 bg-white/5"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-white/12 bg-white/5 px-3 py-3 text-sm text-white/40">
          No high-impact events scheduled today. Quiet tape - structure and momentum
          drive price.
        </div>
      ) : (
        <div className="flex-1 min-h-0 space-y-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-[64px_32px_1fr_56px_52px] gap-x-2 px-2 pb-0.5 text-[10px] uppercase tracking-[0.2em] text-white/25">
            <span>Time CT</span>
            <span>Cur</span>
            <span>Event</span>
            <span className="text-right">Impact</span>
            <span className="text-right">Status</span>
          </div>

          {events.map((ev, i) => (
            <div
              key={i}
              className={`rounded-lg border px-2 py-2 ${
                ev.status === "past"
                  ? "border-white/5 bg-white/[0.02]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="grid grid-cols-[64px_32px_1fr_56px_52px] items-start gap-x-2">
                <span className="font-mono text-[11px] text-white/55">{ev.time}</span>
                <span className="text-[11px] font-bold text-blue-300">{ev.currency}</span>
                <span
                  className={`text-sm font-medium leading-tight ${
                    ev.status === "past" ? "text-white/40" : "text-white"
                  }`}
                >
                  {ev.event}
                </span>
                <div className="flex justify-end">
                  <span className="rounded-md border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">
                    HIGH
                  </span>
                </div>
                <div className="flex justify-end">
                  <span
                    className={`text-[10px] font-semibold ${
                      ev.status === "past"
                        ? "text-white/40"
                        : ev.status === "current"
                        ? "text-yellow-400"
                        : "text-lime-400"
                    }`}
                  >
                    {ev.statusLabel || "Upcoming"}
                  </span>
                </div>
              </div>
              <p className="mt-1 pl-[98px] text-[10px] leading-tight text-white/40">
                {ev.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EarningsRow({ item }: { item: EarningsItem }) {
  const hasActual = item.epsActual != null;
  const hasEstimate = item.epsEstimate != null;
  const beat =
    hasActual && hasEstimate ? item.epsActual! > item.epsEstimate! : null;
  const miss =
    hasActual && hasEstimate ? item.epsActual! < item.epsEstimate! : null;

  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        hasActual
          ? beat
            ? "border-emerald-500/25 bg-emerald-500/[0.04]"
            : miss
            ? "border-red-500/25 bg-red-500/[0.04]"
            : "border-white/12 bg-white/[0.03]"
          : "border-white/12 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-[48px] shrink-0 font-mono text-sm font-bold text-white">
            {item.ticker}
          </span>
          <span className="truncate text-sm text-white/50">{item.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasEstimate && (
            <span className="text-[11px] text-white/35">
              est{" "}
              <span className="text-white/65">
                ${item.epsEstimate!.toFixed(2)}
              </span>
            </span>
          )}
          {hasActual && (
            <span
              className={`text-[11px] font-semibold ${
                beat
                  ? "text-emerald-400"
                  : miss
                  ? "text-red-400"
                  : "text-white/65"
              }`}
            >
              act ${item.epsActual!.toFixed(2)}
              {beat && " BEAT"}
              {miss && " MISS"}
            </span>
          )}
          {!hasActual && !hasEstimate && (
            <span className="text-[10px] text-white/25">pending</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EarningsGroup({
  label,
  labelColor,
  items,
}: {
  label: string;
  labelColor: string;
  items: EarningsItem[];
}) {
  return (
    <div>
      <p className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${labelColor}`}>
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <EarningsRow key={`${label}-${item.ticker}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function EarningsPanel() {
  const [items, setItems] = useState<EarningsItem[]>([]);
  const [date, setDate] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [nextScan, setNextScan] = useState<number | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchEarnings = () => {
      fetch("http://127.0.0.1:8010/market/earnings")
        .then((r) => r.json())
        .then((d) => {
          setItems(d.items ?? []);
          setDate(d.date ?? "");
          setSource(d.source ?? "");
          setLastFetch(Date.now());

          // Schedule next poll based on backend's smart cache TTL
          const ttl = d.nextScanIn ?? 60;
          setNextScan(ttl);
          // Poll the frontend slightly after the cache expires
          timer = setTimeout(fetchEarnings, (ttl + 5) * 1000);
        })
        .catch(() => {
          timer = setTimeout(fetchEarnings, 60000);
        })
        .finally(() => setLoading(false));
    };

    fetchEarnings();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  const beforeOpen = items.filter((i) => i.timingCode === "BMO" || i.timingCode === "4AMEST");
  const afterClose = items.filter((i) => i.timingCode === "AMC");
  const other = items.filter(
    (i) => i.timingCode !== "BMO" && i.timingCode !== "4AMEST" && i.timingCode !== "AMC"
  );
  const reportedCount = items.filter((i) => i.epsActual != null).length;

  const dateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "Today";

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-white/12 bg-[#0b0f18] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          Earnings Watch
          {items.length > 0 && (
            <span className="ml-1.5 text-[11px] font-normal text-white/35">
              {reportedCount}/{items.length} reported
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/40">{dateLabel}</span>
          {source === "none" && (
            <span className="text-[11px] uppercase tracking-widest text-white/25">No API</span>
          )}
          {lastFetch && nextScan != null && (
            <span className="text-[10px] text-white/25" title={`Next FMP scan in ~${Math.ceil(nextScan / 60)}m`}>
              {nextScan >= 3600
                ? "idle"
                : `scan ~${Math.ceil(nextScan / 60)}m`}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-lg border border-white/12 bg-white/5"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-white/12 bg-white/5 px-3 py-3 text-sm text-white/40">
          No earnings scheduled today.
        </div>
      ) : (
        <div className="flex-1 min-h-0 space-y-2.5 overflow-y-auto pr-1">
          {beforeOpen.length > 0 && (
            <EarningsGroup
              label="Before Open"
              labelColor="text-emerald-400"
              items={beforeOpen}
            />
          )}
          {afterClose.length > 0 && (
            <EarningsGroup
              label="After Close"
              labelColor="text-blue-400"
              items={afterClose}
            />
          )}
          {other.length > 0 && (
            <EarningsGroup label="Time TBD" labelColor="text-white/35" items={other} />
          )}
        </div>
      )}
    </div>
  );
}

function MarketSummary() {
  return (
    <div className="rounded-md border border-white/12 bg-[#0b0f18] p-3">
      <p className="mb-1.5 text-[11px] uppercase tracking-[0.18em] text-white/40">
        Last 3 Days
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-white/60">SPY</span>
          <span className="font-semibold text-lime-400">+2.1%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60">QQQ (NASDAQ)</span>
          <span className="font-semibold text-lime-400">+3.4%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60">Russell 2000</span>
          <span className="font-semibold text-lime-400">+1.8%</span>
        </div>
        <div className="mt-1.5 border-t border-white/10 pt-1.5">
          <p className="text-[11px] leading-snug text-white/50">
            Market up on tariff relief hopes and Fed policy uncertainty. Tech
            outperforming. Volatility moderate. Fed speakers today key catalyst.
          </p>
        </div>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (source === "truthsocial") {
    return (
      <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-300">
        Truth
      </span>
    );
  }

  return (
    <span className="rounded-md border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
      X
    </span>
  );
}

function HeadlinesFeed() {
  const [items, setItems] = useState<HeadlineItem[]>([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  async function fetchHeadlines() {
    try {
      const res = await fetch("http://127.0.0.1:8010/market/headlines");
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setSource(data.source ?? "");
        setLastFetch(Date.now());
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHeadlines();
    const interval = setInterval(fetchHeadlines, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-white/12 bg-[#0b0f18] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Headline / Political Risk</h3>
        <div className="flex items-center gap-2">
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (loading ? "bg-white/20" : "animate-pulse bg-green-400")
            }
          />
          <span className="text-sm text-white/40">
            {loading
              ? "Scanning..."
              : lastFetch
              ? relativeTime(new Date(lastFetch).toISOString())
              : "Live"}
          </span>
          {source === "demo" && (
            <span className="text-[11px] uppercase tracking-widest text-white/25">Demo</span>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-white/12 bg-white/5"
            />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-white/12 bg-white/5 p-3 text-sm text-white/40">
          No headlines loaded. Backend may be offline.
        </div>
      )}

      <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={
              "rounded-lg border p-2 " +
              (item.marketRelevant
                ? "border-yellow-500/25 bg-yellow-500/5"
                : "border-white/10 bg-white/[0.03]")
            }
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <SourceBadge source={item.source} />
                <span className="truncate text-sm font-medium text-white/75">
                  {item.handle}
                </span>
              </div>
              <span className="shrink-0 text-[11px] text-white/30">
                {relativeTime(item.timestamp)}
              </span>
            </div>
            <p className="mt-1 text-sm leading-snug text-white/65">{item.text}</p>
            {item.marketRelevant && (
              <p className="mt-1 text-[10px] uppercase tracking-widest text-yellow-400/70">
                Market Relevant
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ctDate = useMemo(() => {
    if (!now) return null;
    return new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  }, [now]);

  const ctTime = useMemo(() => {
    if (!now) return "--:--:--";
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Chicago",
    });
  }, [now]);

  const etTime = useMemo(() => {
    if (!now) return "--:--:--";
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/New_York",
    });
  }, [now]);

  const formattedDate = useMemo(() => {
    if (!now) return "";
    return now.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [now]);

  const sessionLabel = useMemo(() => {
    if (!ctDate) return "Loading...";
    const total = ctDate.getHours() * 60 + ctDate.getMinutes();
    if (total < 510) return "Premarket Prep";
    if (total < 600) return "Opening Window";
    if (total < 900) return "Regular Session";
    return "After Hours";
  }, [ctDate]);

  const dailyFocus = useMemo(() => {
    const hour = ctDate ? ctDate.getHours() : 7;

    if (hour < 8) {
      return {
        title: "Prep the map before the bell",
        body: "Review event risk, opening range expectations, and whether today is a clean trend day or a headline landmine.",
      };
    }

    if (hour < 10) {
      return {
        title: "Trade selectively during the opening window",
        body: "Respect volatility. Let the chart confirm whether ORB, sweep reclaim, or VWAP reclaim fits best.",
      };
    }

    return {
      title: "Protect gains, avoid forcing trades",
      body: "If structure is sloppy, reduce aggression. Keep bias fluid and let the live reader earn the trade.",
    };
  }, [ctDate]);

  return (
    <AppShell>
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-2 overflow-hidden">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-md border border-white/12 bg-[#0b0f18] p-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
              Morning Brief
            </p>
            <h1 className="mt-1.5 text-xl font-semibold tracking-tight">
              Today&apos;s Trading Recap Before You Trade
            </h1>
            <p className="mt-1 text-sm text-white/55">
              Event risk, macro timing, earnings pressure, and what deserves your
              attention first.
            </p>
          </div>

          <div className="rounded-md border border-white/12 bg-[#0b0f18] p-3">
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">Session</p>
            <p className="mt-1.5 text-xl font-semibold">{sessionLabel}</p>
            <p className="mt-1 text-sm text-white/50">{formattedDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 xl:grid-cols-[0.8fr_1.2fr_1fr]">
          <div className="rounded-md border border-white/12 bg-[#0b0f18] p-3">
            <div className="space-y-1.5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  CT
                </p>
                <p className="mt-0.5 text-xl font-semibold text-lime-400">{ctTime}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  ET
                </p>
                <p className="mt-0.5 text-xl font-semibold text-lime-400">{etTime}</p>
              </div>
            </div>
          </div>

          <MarketSummary />

          <div className="rounded-md border border-lime-500/30 bg-lime-500/10 p-3">
            <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-lime-300/90">
              Today&apos;s Focus
            </p>
            <p className="text-sm font-semibold text-lime-100">{dailyFocus.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-lime-100/70">
              {dailyFocus.body}
            </p>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-2 xl:grid-cols-3">
          <EconCalendarPanel />
          <EarningsPanel />
          <HeadlinesFeed />
        </div>
      </div>
    </AppShell>
  );
}