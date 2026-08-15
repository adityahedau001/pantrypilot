import Link from "next/link";

export type MatchedIngredient = {
  id: string;
  name: string;
  quantity: string;
  have: boolean;
  hops: number | null;
  viaSubstitution: boolean;
};

export type MatchedRecipe = {
  id: string;
  name: string;
  cuisine: string;
  minutes: number;
  difficulty: string;
  tags: string[];
  ingredients: MatchedIngredient[];
  haveCount: number;
  total: number;
  missingCount: number;
  matchPercent: number;
};

function Dot({ tone }: { tone: "have" | "sub" | "missing" }) {
  const style =
    tone === "have"
      ? { background: "var(--pp-sage)" }
      : tone === "sub"
        ? { background: "var(--pp-mustard)" }
        : { background: "transparent", border: "1px solid var(--pp-ink-soft)" };
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={style} aria-hidden />;
}

export default function RecipeCard({ recipe }: { recipe: MatchedRecipe }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="index-card relative rounded-lg p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
    >
      <div className="absolute -left-1 top-6 paper-hole" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-utility text-[11px] uppercase tracking-wide" style={{ color: "var(--pp-ink-soft)" }}>
            {recipe.cuisine} · {recipe.minutes} min · {recipe.difficulty}
          </p>
          <h3 className="font-display text-2xl leading-tight mt-1">{recipe.name}</h3>
        </div>
        <div
          className="shrink-0 grid place-items-center w-12 h-12 rounded-full font-utility text-sm font-semibold"
          style={{
            background: recipe.matchPercent >= 80 ? "var(--pp-sage)" : "var(--pp-paprika-soft)",
            color: recipe.matchPercent >= 80 ? "var(--pp-ink)" : "var(--pp-paprika)",
          }}
          title={`${recipe.matchPercent}% match`}
        >
          {recipe.matchPercent}%
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm" style={{ color: "var(--pp-ink)" }}>
        {recipe.ingredients.map((ing) => (
          <span key={ing.id} className="inline-flex items-center gap-1.5">
            <Dot tone={!ing.have ? "missing" : ing.viaSubstitution ? "sub" : "have"} />
            {ing.name}
            {ing.viaSubstitution && ing.hops ? (
              <sup className="font-utility" style={{ color: "var(--pp-mustard)" }}>
                {ing.hops}h
              </sup>
            ) : null}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
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
    </Link>
  );
}
