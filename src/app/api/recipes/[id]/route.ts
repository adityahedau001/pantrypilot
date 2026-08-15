import { NextRequest, NextResponse } from "next/server";
import { runRead } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-helpers";

export const GET = withApiErrorHandling(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;

    const recipeRows = await runRead<{
      id: string;
      name: string;
      minutes: number;
      difficulty: string;
      instructions: string[];
      cuisine: string;
      tags: string[];
    }>(
      `MATCH (r:Recipe {id: $id})-[:BELONGS_TO]->(c:Cuisine)
       OPTIONAL MATCH (r)-[:TAGGED]->(t:FlavorTag)
       WITH r, c, collect(DISTINCT t.name) AS tags
       RETURN r.id AS id, r.name AS name, r.minutes AS minutes, r.difficulty AS difficulty,
              r.instructions AS instructions, c.name AS cuisine, tags AS tags`,
      { id }
    );

    if (recipeRows.length === 0) {
      return NextResponse.json({ error: "not_found", message: "Recipe not found." }, { status: 404 });
    }

    const ingredientRows = await runRead<{
      id: string;
      name: string;
      quantity: string;
      substitutes: { id: string; name: string; similarity: number }[];
      pairings: { id: string; name: string; strength: number }[];
    }>(
      `MATCH (r:Recipe {id: $id})-[rel:CONTAINS]->(i:Ingredient)
       OPTIONAL MATCH (i)-[s:SUBSTITUTES_FOR]-(sub:Ingredient)
       WITH r, i, rel, collect(DISTINCT CASE WHEN sub IS NULL THEN NULL ELSE {id: sub.id, name: sub.name, similarity: s.similarity} END) AS rawSubs
       OPTIONAL MATCH (i)-[p:PAIRS_WITH]-(pair:Ingredient)
       WITH i, rel, rawSubs, collect(DISTINCT CASE WHEN pair IS NULL THEN NULL ELSE {id: pair.id, name: pair.name, strength: p.strength} END) AS rawPairs
       RETURN i.id AS id, i.name AS name, rel.quantity AS quantity,
              [x IN rawSubs WHERE x IS NOT NULL] AS substitutes,
              [x IN rawPairs WHERE x IS NOT NULL] AS pairings
       ORDER BY i.name`,
      { id }
    );

    return NextResponse.json({ ...recipeRows[0], ingredients: ingredientRows });
  }
);
