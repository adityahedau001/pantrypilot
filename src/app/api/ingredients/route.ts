import { NextRequest, NextResponse } from "next/server";
import { runRead } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-helpers";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const rows = await runRead<{ id: string; name: string; category: string }>(
    `MATCH (i:Ingredient)
     WHERE $q = "" OR toLower(i.name) CONTAINS toLower($q)
     RETURN i.id AS id, i.name AS name, i.category AS category
     ORDER BY i.name
     LIMIT 100`,
    { q }
  );

  return NextResponse.json({ ingredients: rows });
});
