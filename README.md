# PantryPilot

Tell PantryPilot what's in your kitchen. It finds recipes you can make right now — including
ones you can reach with a smart ingredient substitution — and can trace a "flavor bridge" between
any two ingredients through a web of pairings and substitutions.

Built for the Wexa AI take-home assignment, on top of **CognoDB** (openCypher over Bolt).

**Live demo:** _add your hosted URL here after deploying_
**Screen recording:** _add your recording link here_

---

## 1. Why a graph database?

The interesting questions in a pantry app are all about *reachability through connections*, not
rows in a table:

- **"What can I cook, allowing one substitution?"** means walking `Recipe → Ingredient →
  (SUBSTITUTES_FOR) → Ingredient` up to a couple of hops deep. In SQL this needs a recursive CTE
  over a self-referencing bridge table, re-joined against every recipe's ingredient list, with
  manual cycle detection — it gets unreadable fast and gets slower with every extra hop. In Cypher
  it's one variable-length pattern: `(pantry)-[:SUBSTITUTES_FOR*0..2]-(needed)`.
- **"What's the shortest flavor path between cumin and coconut milk?"** is arbitrary-depth
  shortest-path search over a general graph — there is no clean relational equivalent at all.
  Cypher has this as a built-in primitive: `shortestPath((a)-[*]-(b))`.
- **Ranking recipes by "how much of this can you make"** is a graph pattern-match-and-score
  problem: for every `CONTAINS` edge on a recipe, is the ingredient in your pantry, or reachable
  from it? That's naturally expressed as one traversal per recipe rather than a chain of joins.

None of this is impossible in a relational schema — it's just that the natural unit of query is a
*path*, not a *row*, and that's exactly what a graph database is built to make cheap and readable.

## 2. Data model

```
(:Ingredient {id, name, category})
(:Recipe {id, name, minutes, difficulty, instructions})
(:Cuisine {id, name})
(:FlavorTag {id, name})

(:Recipe)      -[:CONTAINS {quantity}]->      (:Ingredient)
(:Recipe)      -[:BELONGS_TO]->                (:Cuisine)
(:Recipe)      -[:TAGGED]->                    (:FlavorTag)
(:Ingredient)  -[:SUBSTITUTES_FOR {similarity}]-> (:Ingredient)
(:Ingredient)  -[:PAIRS_WITH {strength}]->     (:Ingredient)
```
┌────────────┐
          ┌─────────▶│  Cuisine   │
          │BELONGS_TO└────────────┘
  ┌───────┴────┐
  │   Recipe   │──────TAGGED───────▶ FlavorTag
  └───────┬────┘
           │ CONTAINS {quantity}
           ▼
   ┌───────────────┐   SUBSTITUTES_FOR {similarity}   ┌───────────────┐
   │  Ingredient    │◀───────────────────────────────▶│  Ingredient    │
   └───────┬────────┘                                 └────────────────┘
           │ PAIRS_WITH {strength}
           ▼
   ┌────────────────┐
   │  Ingredient     │
   └─────────────────┘

   Seed data (in `src/data/seed-data.ts`): 79 ingredients, 28 recipes across 8 cuisines,
11 flavor tags, 47 substitution edges and 28 pairing edges.

## 3. The three main queries

**Pantry match** (`src/app/api/pantry-match/route.ts`) — the multi-hop traversal:

```cypher
UNWIND $pantry AS pantryId
MATCH path = (start:Ingredient {id: pantryId})-[:SUBSTITUTES_FOR*0..2]-(reachable:Ingredient)
WITH reachable, min(length(path)) AS hops
RETURN reachable.id AS ingredientId, hops
```

For every ingredient you have, this finds everything reachable within two substitution hops
(e.g. you have olive oil → reaches butter in 1 hop → reaches ghee in 2 hops) and keeps the
shortest hop count per ingredient. The API layer then joins that against each recipe's
`CONTAINS` list and ranks recipes by a weighted match score.

**Flavor bridge** (`src/app/api/flavor-path/route.ts`) — the awkward-in-SQL query:

```cypher
MATCH (a:Ingredient {id: $from}), (b:Ingredient {id: $to})
MATCH path = shortestPath((a)-[:PAIRS_WITH|SUBSTITUTES_FOR*1..6]-(b))
RETURN [n IN nodes(path) | {id: n.id, name: n.name}] AS nodes,
       [r IN relationships(path) | type(r)] AS relTypes
```

Shortest path across two different relationship types, up to 6 hops, with no fixed depth known
in advance — genuinely painful to express relationally.

**Recipe detail** (`src/app/api/recipes/[id]/route.ts`) — per-ingredient substitutes and pairings
for the "make it your way" panel on each recipe page.

All queries are parameterised through the official `neo4j-driver` — no string-concatenated
Cypher anywhere in the codebase.

## 4. Project structure

## 5. Setup

### 5.1 Create your CognoDB instance

1. Sign up at [console.cognodb.com/signup](https://console.cognodb.com/signup) (no credit card needed).
2. Create a free **c0** instance and pick a region.
3. Copy the connection URI (`bolt+s://<instance-id>.databases.cognodb.cloud`) and the generated
   password for user `cognodb` — shown once, so save it immediately.

### 5.2 Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `COGNODB_URI`, `COGNODB_USER=cognodb`, `COGNODB_PASSWORD`.

### 5.3 Install, seed, and run

```bash
npm install
npm run seed     # loads ingredients, recipes and relationships into CognoDB
npm run dev      # http://localhost:3000
```

### 5.4 Deploy

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add `COGNODB_URI`, `COGNODB_USER`, `COGNODB_PASSWORD` as Environment Variables.
4. Deploy.

## 6. Error handling

If CognoDB is unreachable, API routes return a clean `503` (`src/lib/api-helpers.ts`, `src/lib/db.ts`),
and the UI shows a "the pantry shelf is unreachable" state instead of crashing
(`src/components/StateBanner.tsx`).

## 7. Screenshots

Pantry Match — empty state
<img width="1440" height="1024" alt="01-home-empty" src="https://github.com/user-attachments/assets/499b8eb7-336c-44ff-9bd2-48887c2f287c" />

Pantry Match — ingredients added
<img width="1440" height="1024" alt="02-home-pantry-filled" src="https://github.com/user-attachments/assets/54dc9168-e657-4ae1-bf7e-dd7d8cf50d38" />

Pantry Match — results with substitution matches
<img width="1440" height="2805" alt="03-home-results" src="https://github.com/user-attachments/assets/21c3249b-9ecb-4cc1-9cc5-2a4b1431b6d9" />

Recipe detail — with swap & pairing suggestions
<img width="1440" height="1311" alt="04-recipe-detail" src="https://github.com/user-attachments/assets/786278eb-7caf-4275-91af-f304af90d282" />

Flavor Bridge — tracing Cheddar to Tomato across the graph
<img width="1440" height="1024" alt="05-flavor-bridge" src="https://github.com/user-attachments/assets/5759f6b4-7264-4194-b7b4-75d1009239d2" />






