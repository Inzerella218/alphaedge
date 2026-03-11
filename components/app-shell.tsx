"use client";

import TopNav from "./top-nav";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
  brokerLabel?: string;
  brokerStatus?: string;
  accountLabel?: string;
};

export default function AppShell({
  children,
  brokerLabel = "No Broker",
  brokerStatus = "Disconnected",
  accountLabel = "No Account",
}: Props) {
  const pathname = usePathname();
  const isFocusPage =
    pathname === "/market-strategy" ||
    pathname === "/stock-scanner" ||
    pathname === "/trading";

  return (
    <main className="h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="mx-auto flex h-screen max-w-[1600px] flex-col px-3 py-2 xl:px-4">
        <header className="mb-2 shrink-0">
          <div className="flex min-h-[52px] items-center justify-between rounded-2xl border border-white/10 bg-[#0b0f18]/95 px-3 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur">
            <div className="flex min-w-0 items-center gap-4">
              <Link
                href="/dashboard"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-[11px] font-semibold tracking-[0.18em] text-blue-300"
              >
                AE
              </Link>

              <div className="hidden items-center gap-4 md:flex">
                <p className="text-sm font-semibold text-white">AlphaEdge</p>
                <TopNav />
              </div>

              <div className="md:hidden">
                <p className="text-sm font-semibold text-white">
                  {isFocusPage ? "Focus" : "AlphaEdge"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-blue-300">
                {brokerLabel}
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/60">
                {brokerStatus}
              </div>

              <div className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/60 lg:block">
                {accountLabel}
              </div>
            </div>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-hidden">{children}</section>
      </div>
    </main>
  );
}
