"use client";

import { useEffect, useState } from "react";
import IngredientSelect from "@/components/IngredientSelect";
import type { IngredientOption } from "@/components/PantryPicker";
import FlavorBridge from "@/components/FlavorBridge";
import { DatabaseUnavailableBanner, EmptyState, LoadingGrid } from "@/components/StateBanner";

type PathResult = {
  found: boolean;
  nodes: { id: string; name: string }[];
  relTypes: string[];
};

export default function FlavorPathPage() {
  const [allIngredients, setAllIngredients] = useState<IngredientOption[]>([]);
  const [from, setFrom] = useState<IngredientOption | null>(null);
  const [to, setTo] = useState<IngredientOption | null>(null);
  const [result, setResult] = useState<PathResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbDown, setDbDown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ingredients")
      .then((r) => {
        if (r.status === 503) throw new Error("db");
        return r.json();
      })
      .then((data) => setAllIngredients(data.ingredients))
      .catch(() => setDbDown(true));
  }, []);

  async function findPath() {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/flavor-path?from=${from.id}&to=${to.id}`);
      if (res.status === 503) {
        setDbDown(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        return;
      }
      setResult(data);
    } catch {
      setDbDown(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="max-w-2xl">
        <p className="font-utility text-xs uppercase tracking-widest" style={{ color: "var(--pp-mustard)" }}>
          Two ingredients, one thread
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] mt-2" style={{ color: "var(--pp-parchment)" }}>
          Find the flavor bridge between any two ingredients.
        </h1>
        <p className="mt-4 text-base" style={{ color: "var(--pp-parchment-dim)" }}>
          PantryPilot walks the shortest chain of pairings and substitutions connecting them —
          the same kind of path-finding that makes graph databases a natural fit for this data.
        </p>
      </section>

      {dbDown ? (
        <div className="mt-8">
          <DatabaseUnavailableBanner />
        </div>
      ) : (
        <>
          <section className="mt-8 index-card rounded-xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <IngredientSelect label="From" allIngredients={allIngredients} value={from} onChange={setFrom} />
              <IngredientSelect label="To" allIngredients={allIngredients} value={to} onChange={setTo} />
              <button
                onClick={findPath}
                disabled={!from || !to || loading}
                className="rounded-full px-5 py-3 font-medium text-sm disabled:opacity-40 h-fit"
                style={{ background: "var(--pp-paprika)", color: "var(--pp-parchment)" }}
              >
                {loading ? "Tracing…" : "Trace the bridge"}
              </button>
            </div>
          </section>

          <section className="mt-10">
            {loading && <LoadingGrid count={1} />}
            {!loading && error && <EmptyState title="Couldn't trace a path" body={error} />}
            {!loading && result && !result.found && (
              <EmptyState
                title="No bridge found within 6 hops"
                body="These two ingredients aren't connected closely enough in the flavor graph yet — try a different pair."
              />
            )}
            {!loading && result?.found && (
              <div className="index-card rounded-xl p-6 sm:p-8 overflow-x-auto">
                <FlavorBridge nodes={result.nodes} relTypes={result.relTypes} />
                <p className="mt-6 text-sm" style={{ color: "var(--pp-ink-soft)" }}>
                  {result.nodes.length - 1} hop{result.nodes.length - 1 === 1 ? "" : "s"} from{" "}
                  <strong>{result.nodes[0].name}</strong> to{" "}
                  <strong>{result.nodes[result.nodes.length - 1].name}</strong>.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
