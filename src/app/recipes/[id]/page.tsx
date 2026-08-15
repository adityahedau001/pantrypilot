"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DatabaseUnavailableBanner, EmptyState, LoadingGrid } from "@/components/StateBanner";

type RecipeDetail = {
  id: string;
  name: string;
  minutes: number;
  difficulty: string;
  instructions: string[];
  cuisine: string;
  tags: string[];
  ingredients: {
    id: string;
    name: string;
    quantity: string;
    substitutes: { id: string; name: string; similarity: number }[];
    pairings: { id: string; name: string; strength: number }[];
  }[];
};

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbDown, setDbDown] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    // Reset to a loading state when navigating between recipe pages
    // (the page component is reused across dynamic-segment changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on id change
    setLoading(true);
    fetch(`/api/recipes/${params.id}`)
      .then((r) => {
        if (r.status === 503) throw new Error("db");
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setRecipe(data);
      })
      .catch(() => setDbDown(true))
      .finally(() => setLoading(false));
  }, [params?.id]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="text-sm underline underline-offset-2" style={{ color: "var(--pp-mustard)" }}>
        ← Back to Pantry Match
      </Link>

      <div className="mt-6">
        {loading && <LoadingGrid count={1} />}
        {!loading && dbDown && <DatabaseUnavailableBanner />}
        {!loading && notFound && (
          <EmptyState title="Recipe not found" body="This recipe may have been removed from the graph." />
        )}
        {!loading && recipe && (
          <article className="index-card rounded-xl p-6 sm:p-8">
            <p className="font-utility text-[11px] uppercase tracking-wide" style={{ color: "var(--pp-ink-soft)" }}>
              {recipe.cuisine} · {recipe.minutes} min · {recipe.difficulty}
            </p>
            <h1 className="font-display text-4xl mt-2">{recipe.name}</h1>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {recipe.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ background: "var(--pp-parchment-dim)", color: "var(--pp-ink-soft)" }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-8 mt-8">
              <section>
                <h2 className="font-display text-xl mb-3">Ingredients</h2>
                <ul className="space-y-4">
                  {recipe.ingredients.map((ing) => (
                    <li key={ing.id} className="border-b pb-3" style={{ borderColor: "var(--pp-line)" }}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">{ing.name}</span>
                        <span className="font-utility text-sm" style={{ color: "var(--pp-ink-soft)" }}>
                          {ing.quantity}
                        </span>
                      </div>
                      {ing.substitutes.length > 0 && (
                        <p className="text-xs mt-1.5" style={{ color: "var(--pp-ink-soft)" }}>
                          Swap for:{" "}
                          {ing.substitutes.map((s) => s.name).join(", ")}
                        </p>
                      )}
                      {ing.pairings.length > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--pp-sage)" }}>
                          Pairs well with: {ing.pairings.map((p) => p.name).join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl mb-3">Method</h2>
                <ol className="space-y-3 list-decimal list-inside text-sm leading-relaxed">
                  {recipe.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </section>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
