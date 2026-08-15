import { NextRequest, NextResponse } from "next/server";
import { runRead } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-helpers";

const MAX_SUB_HOPS = 2; // how far through SUBSTITUTES_FOR we'll traverse to call something "makeable"

type ReachableRow = { ingredientId: string; hops: number };
type RecipeRow = {
  id: string;
  name: string;
  cuisine: string;
  minutes: number;
  difficulty: string;
  tags: string[];
  ingredients: { id: string; name: string; quantity: string }[];
};

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const pantry: string[] = Array.isArray(body?.ingredients) ? body.ingredients : [];

  if (pantry.length === 0) {
    return NextResponse.json({ recipes: [] });
  }

  // --- Multi-hop traversal (2 hops) ---
  // For every ingredient reachable from anything in the pantry via up to
  // MAX_SUB_HOPS SUBSTITUTES_FOR edges (in either direction), find the
  // shortest hop distance. Hop 0 = you have it. Hop 1+ = reachable via a
  // chain of substitutions (e.g. you have olive oil -> reaches butter in 1 hop
  // -> reaches ghee in 2 hops, because olive oil substitutes for butter and
  // butter substitutes for ghee).
  const reachable = await runRead<ReachableRow>(
    `UNWIND $pantry AS pantryId
     MATCH path = (start:Ingredient {id: pantryId})-[:SUBSTITUTES_FOR*0..${MAX_SUB_HOPS}]-(reachable:Ingredient)
     WITH reachable, min(length(path)) AS hops
     RETURN reachable.id AS ingredientId, hops`,
    { pantry }
  );
  const hopById = new Map<string, number>(reachable.map((r) => [r.ingredientId, r.hops]));

  // --- Recipe + ingredient list ---
  const recipeRows = await runRead<RecipeRow>(
    `MATCH (r:Recipe)-[:BELONGS_TO]->(c:Cuisine)
     OPTIONAL MATCH (r)-[:TAGGED]->(t:FlavorTag)
     WITH r, c, collect(DISTINCT t.name) AS tags
     MATCH (r)-[rel:CONTAINS]->(i:Ingredient)
     RETURN r.id AS id, r.name AS name, c.name AS cuisine, r.minutes AS minutes,
            r.difficulty AS difficulty, tags AS tags,
            collect({id: i.id, name: i.name, quantity: rel.quantity}) AS ingredients`,
    {}
  );

  const results = recipeRows.map((recipe) => {
    const ingredientMatches = recipe.ingredients.map((ing) => {
      const hops = hopById.get(ing.id);
      return {
        ...ing,
        have: hops !== undefined,
        hops: hops ?? null,
        viaSubstitution: hops !== undefined && hops > 0,
      };
    });

    const haveCount = ingredientMatches.filter((i) => i.have).length;
    const total = ingredientMatches.length;
    const weightedScore = ingredientMatches.reduce((sum, i) => {
      if (!i.have) return sum;
      return sum + (i.hops === 0 ? 1 : 1 - i.hops! * 0.25);
    }, 0);

    return {
      id: recipe.id,
      name: recipe.name,
      cuisine: recipe.cuisine,
      minutes: recipe.minutes,
      difficulty: recipe.difficulty,
      tags: recipe.tags,
      ingredients: ingredientMatches,
      haveCount,
      total,
      missingCount: total - haveCount,
      matchPercent: Math.round((weightedScore / total) * 100),
    };
  });

  results.sort((a, b) => b.matchPercent - a.matchPercent || a.missingCount - b.missingCount);

  return NextResponse.json({ recipes: results });
});
