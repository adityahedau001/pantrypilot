"use client";

import { useEffect, useState } from "react";
import PantryPicker, { IngredientOption } from "@/components/PantryPicker";
import RecipeCard, { MatchedRecipe } from "@/components/RecipeCard";
import { DatabaseUnavailableBanner, EmptyState, LoadingGrid } from "@/components/StateBanner";

export default function HomePage() {
  const [allIngredients, setAllIngredients] = useState<IngredientOption[]>([]);
  const [selected, setSelected] = useState<IngredientOption[]>([]);
  const [recipes, setRecipes] = useState<MatchedRecipe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbDown, setDbDown] = useState(false);
  const [ingredientsLoadFailed, setIngredientsLoadFailed] = useState(false);

  useEffect(() => {
    fetch("/api/ingredients")
      .then((r) => {
        if (r.status === 503) throw new Error("db_unavailable");
        return r.json();
      })
      .then((data) => setAllIngredients(data.ingredients))
      .catch(() => setIngredientsLoadFailed(true));
  }, []);

  async function findRecipes() {
    setLoading(true);
    setDbDown(false);
    try {
      const res = await fetch("/api/pantry-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: selected.map((s) => s.id) }),
      });
      if (res.status === 503) {
        setDbDown(true);
        setRecipes(null);
        return;
      }
      const data = await res.json();
      setRecipes(data.recipes);
    } catch {
      setDbDown(true);
      setRecipes(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="max-w-2xl">
        <p className="font-utility text-xs uppercase tracking-widest" style={{ color: "var(--pp-mustard)" }}>
          What&apos;s on the shelf?
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] mt-2" style={{ color: "var(--pp-parchment)" }}>
          Tell PantryPilot what you have. It finds what you can cook.
        </h1>
        <p className="mt-4 text-base" style={{ color: "var(--pp-parchment-dim)" }}>
          Add a few ingredients and PantryPilot searches the recipe graph — including one smart
          substitution hop, like reaching a butter recipe with olive oil on hand.
        </p>
      </section>

      <section className="mt-8 index-card rounded-xl p-5 sm:p-6">
        {ingredientsLoadFailed ? (
          <DatabaseUnavailableBanner />
        ) : (
          <>
            <PantryPicker allIngredients={allIngredients} selected={selected} onChange={setSelected} />
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={findRecipes}
                disabled={selected.length === 0 || loading}
                className="rounded-full px-5 py-2.5 font-medium text-sm disabled:opacity-40 transition-opacity"
                style={{ background: "var(--pp-paprika)", color: "var(--pp-parchment)" }}
              >
                {loading ? "Searching the graph…" : "Find recipes"}
              </button>
              {recipes && !loading && (
                <span className="text-sm" style={{ color: "var(--pp-ink-soft)" }}>
                  {recipes.length} recipe{recipes.length === 1 ? "" : "s"} ranked by match
                </span>
              )}
            </div>
          </>
        )}
      </section>

      <section className="mt-8">
        {loading && <LoadingGrid />}
        {!loading && dbDown && <DatabaseUnavailableBanner />}
        {!loading && !dbDown && recipes && recipes.length === 0 && (
          <EmptyState
            title="No recipes reachable from that pantry yet"
            body="Try adding a staple like garlic, onion, or flour — most recipes lean on at least one of those."
          />
        )}
        {!loading && !dbDown && recipes && recipes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
        {!loading && !recipes && !dbDown && (
          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--pp-parchment-dim)" }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--pp-sage)" }} />
              you have it
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--pp-mustard)" }} />
              reachable via substitution
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full border" style={{ borderColor: "var(--pp-parchment-dim)" }} />
              missing
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
