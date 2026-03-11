"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Strategy", href: "/market-strategy" },
  { label: "Scanner", href: "/stock-scanner" },
  { label: "Trading", href: "/trading" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 text-sm">
      {navItems.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`transition ${
              active
                ? "text-white font-semibold"
                : "text-white/50 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
