import TopNav from "./top-nav";
import { ReactNode } from "react";

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
  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <div className="mx-auto min-h-screen max-w-[1600px] px-6 py-6">
        <header className="mb-8">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold tracking-[0.18em] text-blue-300">
                  AE
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-white/35">
                    Alpha Edge
                  </p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-white">
                    Trading Command Center
                  </h1>
                  <p className="mt-1 text-sm text-white/50">
                    Strategy, scanning, execution, and control in one place
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
                  {brokerLabel}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60">
                  Status: {brokerStatus}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60">
                  {accountLabel}
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <TopNav />
            </div>
          </div>
        </header>

        <section>{children}</section>
      </div>
    </main>
  );
}