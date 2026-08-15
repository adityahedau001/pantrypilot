import type { Metadata } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PantryPilot — cook with what you have",
  description:
    "Tell PantryPilot what's in your kitchen and it finds recipes you can make, including smart ingredient substitutions, powered by a graph database.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--pp-shelf)" }}>
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 py-6">
          <div className="mx-auto max-w-6xl px-6 text-xs" style={{ color: "var(--pp-parchment-dim)" }}>
            PantryPilot — a graph-backed recipe explorer, built on CognoDB.
          </div>
        </footer>
      </body>
    </html>
  );
}
