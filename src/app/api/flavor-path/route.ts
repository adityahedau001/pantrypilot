import { NextRequest, NextResponse } from "next/server";
import { runRead } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/api-helpers";

type PathRow = {
  nodes: { id: string; name: string }[];
  relTypes: string[];
};

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "bad_request", message: "Both 'from' and 'to' ingredient ids are required." },
      { status: 400 }
    );
  }

  if (from === to) {
    return NextResponse.json(
      { error: "bad_request", message: "Pick two different ingredients." },
      { status: 400 }
    );
  }

  // Shortest path across BOTH flavor-pairing and substitution edges — this is
  // the kind of arbitrary-depth reachability query a relational schema
  // struggles with (it would need a recursive CTE re-walking a bridge table
  // and manually tracking visited nodes to avoid cycles).
  const rows = await runRead<PathRow>(
    `MATCH (a:Ingredient {id: $from}), (b:Ingredient {id: $to})
     MATCH path = shortestPath((a)-[:PAIRS_WITH|SUBSTITUTES_FOR*1..6]-(b))
     RETURN [n IN nodes(path) | {id: n.id, name: n.name}] AS nodes,
            [r IN relationships(path) | type(r)] AS relTypes`,
    { from, to }
  );

  if (rows.length === 0) {
    return NextResponse.json({ found: false, nodes: [], relTypes: [] });
  }

  return NextResponse.json({ found: true, ...rows[0] });
});
