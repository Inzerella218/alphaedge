"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";

type RiskTone = "High" | "Medium" | "Low";

type EventItem = {
  time: string;
  title: string;
  impact: RiskTone;
  note: string;
};

const macroEvents: EventItem[] = [
  {
    time: "7:30 AM CT",
    title: "U.S. CPI / Inflation Risk",
    impact: "High",
    note: "Expect index, futures, USD, and rates to react quickly if surprise is large.",
  },
  {
    time: "9:00 AM CT",
    title: "Fed Speakers / Policy Tone",
    impact: "Medium",
    note: "Market can reprice fast if policy language shifts risk sentiment.",
  },
  {
    time: "All Day",
    title: "Forex Calendar Watch",
    impact: "Medium",
    note: "Watch USD, EUR, GBP, JPY event windows because they can bleed into ES / NQ tone.",
  },
];

const earningsItems: EventItem[] = [
  {
    time: "Before Open",
    title: "Mega-cap earnings watch",
    impact: "High",
    note: "Large tech and index-heavy names can move ES / NQ sentiment immediately.",
  },
  {
    time: "After Close",
    title: "Post-close earnings risk",
    impact: "Medium",
    note: "Useful for tomorrow prep and overnight futures posture.",
  },
];

const politicalItems: EventItem[] = [
  {
    time: "Any Time",
    title: "Fed / Treasury / geopolitical headlines",
    impact: "High",
    note: "This is the bucket for sudden policy, rates, war, sanctions, or election-shock headlines.",
  },
];

function toneClass(tone: RiskTone) {
  if (tone === "High") return "text-red-300 border-red-500/20 bg-red-500/10";
  if (tone === "Medium") return "text-yellow-300 border-yellow-500/20 bg-yellow-500/10";
  return "text-emerald-300 border-emerald-500/20 bg-emerald-500/10";
}

export default function DashboardPage() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    if (!now) return "--:--:--";
    return now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [now]);

  const formattedDate = useMemo(() => {
    if (!now) return "Loading date...";
    return now.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [now]);

  const sessionLabel = useMemo(() => {
    if (!now) return "Loading session...";
    const hour = now.getHours();
    const minute = now.getMinutes();
    const total = hour * 60 + minute;

    if (total < 510) return "Premarket Prep";
    if (total < 600) return "Opening Window";
    if (total < 900) return "Regular Session";
    return "After Hours / Prep";
  }, [now]);

  const dailyFocus = useMemo(() => {
    const hour = now ? now.getHours() : 7;

    if (hour < 8) {
      return {
        title: "Prep the map before the bell",
        body: "Focus on event risk, opening range expectations, and whether today is a clean trend day or a headline landmine.",
      };
    }

    if (hour < 10) {
      return {
        title: "Trade selectively during the opening window",
        body: "Respect volatility. Let the chart and macro tone confirm whether ORB, sweep reclaim, or VWAP reclaim fits best.",
      };
    }

    return {
      title: "Protect gains and avoid forcing trades",
      body: "If structure is sloppy, reduce aggression. Keep bias fluid and let the live reader earn the trade.",
    };
  }, [now]);

  return (
    <AppShell>
      <div className="h-full min-h-0 overflow-hidden">
        <div className="grid h-full min-h-0 gap-3 grid-rows-[auto_auto_minmax(0,1fr)_auto]">
          <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                Morning Brief
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Today’s Trading Recap Before You Trade
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Big event risk, macro timing, earnings pressure, and what deserves your attention first.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Current Time</p>
              <p className="mt-2 text-2xl font-semibold">{formattedTime}</p>
              <p className="mt-1 text-sm text-white/55">{formattedDate}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Session</p>
              <p className="mt-2 text-2xl font-semibold">{sessionLabel}</p>
              <p className="mt-1 text-sm text-white/55">America/Chicago</p>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1.1fr]">
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-red-200/80">Event Risk</p>
              <p className="mt-2 text-xl font-semibold text-red-100">High Alert</p>
              <p className="mt-1 text-sm text-red-100/70">
                If there is major data or policy language, size down until the market proves direction.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Primary Focus</p>
              <p className="mt-2 text-xl font-semibold">ES / NQ / USD tone</p>
              <p className="mt-1 text-sm text-white/60">
                Use macro tone first, then refine with the chart.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Best Use</p>
              <p className="mt-2 text-xl font-semibold">Wait for confirmation</p>
              <p className="mt-1 text-sm text-white/60">
                Let the cockpit tell you whether ORB, sweep, or VWAP reclaim actually fits.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Today’s Focus</p>
              <p className="mt-2 text-lg font-semibold text-emerald-100">{dailyFocus.title}</p>
              <p className="mt-1 text-sm text-emerald-100/70">{dailyFocus.body}</p>
            </div>
          </div>

          <div className="grid min-h-0 gap-3 xl:grid-cols-[1.15fr_1fr_0.9fr]">
            <div className="min-h-0 rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Macro / Forex Calendar</h3>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  What can move the tape
                </span>
              </div>

              <div className="space-y-3">
                {macroEvents.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-white/45">{item.time}</p>
                      </div>
                      <div className={"rounded-full border px-2.5 py-1 text-xs " + toneClass(item.impact)}>
                        {item.impact}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/65">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Earnings Watch</h3>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  Index pressure
                </span>
              </div>

              <div className="space-y-3">
                {earningsItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-white/45">{item.time}</p>
                      </div>
                      <div className={"rounded-full border px-2.5 py-1 text-xs " + toneClass(item.impact)}>
                        {item.impact}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/65">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 rounded-3xl border border-white/10 bg-[#0b0f18]/95 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Headline / Political Risk</h3>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  Anything that can shock price
                </span>
              </div>

              <div className="space-y-3">
                {politicalItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-white/45">{item.time}</p>
                      </div>
                      <div className={"rounded-full border px-2.5 py-1 text-xs " + toneClass(item.impact)}>
                        {item.impact}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/65">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <a
              href="/market-strategy"
              className="rounded-3xl bg-white px-4 py-4 text-center text-sm font-semibold text-black transition hover:opacity-90"
            >
              Open Trade Cockpit
            </a>

            <a
              href="/stock-scanner"
              className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open Stock Scanner
            </a>

            <a
              href="/trading"
              className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open Trading Workspace
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}