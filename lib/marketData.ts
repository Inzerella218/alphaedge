export async function fetchMarketData() {
  const res = await fetch("http://127.0.0.1:8010/scanner", {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch scanner data")
  }

  const data = await res.json()

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data.rows)) {
    return data.rows
  }

  return []
}
