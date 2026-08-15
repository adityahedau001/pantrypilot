"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Pantry Match" },
  { href: "/flavor-path", label: "Flavor Bridge" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span
            className="grid place-items-center w-9 h-9 rounded-full text-shelf font-utility text-sm font-bold"
            style={{ background: "var(--pp-mustard)" }}
            aria-hidden
          >
            PP
          </span>
          <span className="font-display text-xl tracking-tight" style={{ color: "var(--pp-parchment)" }}>
            PantryPilot
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2 rounded-full transition-colors"
                style={{
                  color: active ? "var(--pp-shelf)" : "var(--pp-parchment-dim)",
                  background: active ? "var(--pp-mustard)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
