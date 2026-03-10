export type ScannerFilter = {
  id: string;
  label: string;
  value: string;
};

export type ScannerProfile = {
  id: string;
  name: string;
  description: string;
  filters: ScannerFilter[];
};

export const scannerProfiles: ScannerProfile[] = [
  {
    id: "high-demand-low-supply",
    name: "High Demand / Low Supply",
    description:
      "Momentum stock profile focused on unusual demand, strong price expansion, and limited float.",
    filters: [
      { id: "relative-volume", label: "Relative Volume", value: "5x+" },
      { id: "percent-up", label: "% Up on Day", value: "30%+" },
      { id: "news-catalyst", label: "News Catalyst", value: "Required" },
      { id: "price-range", label: "Price Range", value: "$3–$20" },
      { id: "float", label: "Float", value: "Under 5M preferred" },
    ],
  },
  {
    id: "large-cap-momentum",
    name: "Large Cap Momentum",
    description:
      "Large-cap runner profile for cleaner liquidity and strong intraday continuation.",
    filters: [
      { id: "relative-volume", label: "Relative Volume", value: "2x+" },
      { id: "percent-up", label: "% Up on Day", value: "5%+" },
      { id: "news-catalyst", label: "News Catalyst", value: "Preferred" },
      { id: "price-range", label: "Price Range", value: "$20+" },
      { id: "liquidity", label: "Liquidity", value: "High" },
    ],
  },
];