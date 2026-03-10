import AppShell from "@/components/app-shell";
import { scannerProfiles } from "@/lib/scanner-config";

const activeProfile = scannerProfiles[0];

const scannerRows = [
  {
    ticker: "ABCD",
    price: "$6.42",
    change: "+34%",
    rvol: "6.1x",
    float: "4.8M",
    catalyst: "News",
  },
  {
    ticker: "EFGH",
    price: "$12.18",
    change: "+31%",
    rvol: "5.4x",
    float: "3.9M",
    catalyst: "News",
  },
  {
    ticker: "IJKL",
    price: "$4.73",
    change: "+28%",
    rvol: "4.9x",
    float: "5.2M",
    catalyst: "Rumor",
  },
];

export default function StockScannerPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-white/40">
          Discovery
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Stock Scanner
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-white/60">
          Separate momentum stock workflow with configurable scanner profiles,
          saved filters, and ranked trade candidates.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {scannerProfiles.map((profile, index) => (
          <button
            key={profile.id}
            className={`rounded-2xl px-5 py-3 text-sm font-medium ${
              index === 0
                ? "bg-white text-black"
                : "border border-white/10 bg-white/[0.04] text-white/80"
            }`}
          >
            {profile.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">{activeProfile.name}</h3>
            <p className="mt-2 text-sm text-white/60">
              {activeProfile.description}
            </p>

            <div className="mt-5 space-y-3">
              {activeProfile.filters.map((filter) => (
                <div
                  key={filter.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    {filter.label}
                  </p>
                  <p className="mt-2 text-sm text-white/80">{filter.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Scanner Actions</h3>

            <div className="mt-4 grid gap-2">
              <button className="rounded-xl bg-white py-2 font-medium text-black">
                Run Scan
              </button>
              <button className="rounded-xl border border-white/10 py-2">
                Save Watchlist
              </button>
              <button className="rounded-xl border border-white/10 py-2">
                Send to Trading
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scanner Results</h3>
              <p className="text-sm text-white/50">
                {scannerRows.length} candidates
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/50">
                  <tr>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">% Change</th>
                    <th className="px-4 py-3">RVOL</th>
                    <th className="px-4 py-3">Float</th>
                    <th className="px-4 py-3">Catalyst</th>
                  </tr>
                </thead>
                <tbody>
                  {scannerRows.map((row) => (
                    <tr key={row.ticker} className="border-t border-white/10">
                      <td className="px-4 py-3 font-medium">{row.ticker}</td>
                      <td className="px-4 py-3">{row.price}</td>
                      <td className="px-4 py-3">{row.change}</td>
                      <td className="px-4 py-3">{row.rvol}</td>
                      <td className="px-4 py-3">{row.float}</td>
                      <td className="px-4 py-3">{row.catalyst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold">Selected Symbol Detail</h3>

            <div className="mt-4 flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-white/30">
              Scanner chart / details panel
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}