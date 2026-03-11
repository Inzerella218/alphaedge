export async function fetchMarketData() {
  const res = await fetch("http://127.0.0.1:8000/scanner", {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch scanner data")
  }

  return await res.json()
}