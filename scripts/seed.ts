/**
 * Seeds CognoDB with the PantryPilot graph: ingredients, recipes, cuisines,
 * flavor tags and their relationships.
 *
 * Usage:
 *   npm run seed          # load data (safe to re-run — uses MERGE, idempotent)
 *   npm run seed -- --reset   # wipe the database first, then load
 *
 * Reads connection details from environment variables (see .env.example).
 */
import "dotenv/config";
import { runWrite, closeDriver, checkConnection } from "../src/lib/db";
import {
  ingredients,
  cuisines,
  flavorTags,
  recipes,
  substitutions,
  pairings,
} from "../src/data/seed-data";

async function reset() {
  console.log("Wiping existing data...");
  let deleted = 1;
  while (deleted > 0) {
    const res = await runWrite<{ deleted: number }>(
      `MATCH (n) WITH n LIMIT 500 DETACH DELETE n RETURN count(n) AS deleted`
    );
    deleted = Number(res[0]?.deleted ?? 0);
  }
}

async function createConstraints() {
  console.log("Creating uniqueness constraints...");
  const constraints = [
    `CREATE CONSTRAINT ingredient_id IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.id IS UNIQUE`,
    `CREATE CONSTRAINT recipe_id IF NOT EXISTS FOR (r:Recipe) REQUIRE r.id IS UNIQUE`,
    `CREATE CONSTRAINT cuisine_id IF NOT EXISTS FOR (c:Cuisine) REQUIRE c.id IS UNIQUE`,
    `CREATE CONSTRAINT flavortag_id IF NOT EXISTS FOR (t:FlavorTag) REQUIRE t.id IS UNIQUE`,
  ];
  for (const cypher of constraints) {
    await runWrite(cypher);
  }
}

async function loadIngredients() {
  console.log(`Loading ${ingredients.length} ingredients...`);
  await runWrite(
    `UNWIND $rows AS row
     MERGE (i:Ingredient {id: row.id})
     SET i.name = row.name, i.category = row.category`,
    { rows: ingredients }
  );
}

async function loadCuisines() {
  console.log(`Loading ${cuisines.length} cuisines...`);
  await runWrite(
    `UNWIND $rows AS row
     MERGE (c:Cuisine {id: row.id})
     SET c.name = row.name`,
    { rows: cuisines }
  );
}

async function loadFlavorTags() {
  console.log(`Loading ${flavorTags.length} flavor tags...`);
  await runWrite(
    `UNWIND $rows AS row
     MERGE (t:FlavorTag {id: row.id})
     SET t.name = row.name`,
    { rows: flavorTags }
  );
}

async function loadRecipes() {
  console.log(`Loading ${recipes.length} recipes...`);
  await runWrite(
    `UNWIND $rows AS row
     MERGE (r:Recipe {id: row.id})
     SET r.name = row.name,
         r.minutes = row.minutes,
         r.difficulty = row.difficulty,
         r.instructions = row.instructions
     WITH r, row
     MATCH (c:Cuisine {id: row.cuisine})
     MERGE (r)-[:BELONGS_TO]->(c)`,
    { rows: recipes.map((r) => ({ ...r, ingredients: undefined, tags: undefined })) }
  );

  console.log("Linking recipes to ingredients (CONTAINS)...");
  const containsRows = recipes.flatMap((r) =>
    r.ingredients.map((ri) => ({
      recipe: r.id,
      ingredient: ri.ingredient,
      quantity: ri.quantity,
    }))
  );
  await runWrite(
    `UNWIND $rows AS row
     MATCH (r:Recipe {id: row.recipe})
     MATCH (i:Ingredient {id: row.ingredient})
     MERGE (r)-[c:CONTAINS]->(i)
     SET c.quantity = row.quantity`,
    { rows: containsRows }
  );

  console.log("Linking recipes to flavor tags (TAGGED)...");
  const tagRows = recipes.flatMap((r) => r.tags.map((tag) => ({ recipe: r.id, tag })));
  await runWrite(
    `UNWIND $rows AS row
     MATCH (r:Recipe {id: row.recipe})
     MATCH (t:FlavorTag {id: row.tag})
     MERGE (r)-[:TAGGED]->(t)`,
    { rows: tagRows }
  );
}

async function loadSubstitutions() {
  console.log(`Loading ${substitutions.length} SUBSTITUTES_FOR edges...`);
  await runWrite(
    `UNWIND $rows AS row
     MATCH (a:Ingredient {id: row.from})
     MATCH (b:Ingredient {id: row.to})
     MERGE (a)-[s:SUBSTITUTES_FOR]->(b)
     SET s.similarity = row.similarity`,
    { rows: substitutions }
  );
}

async function loadPairings() {
  console.log(`Loading ${pairings.length} PAIRS_WITH edges...`);
  await runWrite(
    `UNWIND $rows AS row
     MATCH (a:Ingredient {id: row.a})
     MATCH (b:Ingredient {id: row.b})
     MERGE (a)-[p:PAIRS_WITH]->(b)
     SET p.strength = row.strength`,
    { rows: pairings }
  );
}

async function main() {
  console.log("Checking connection to CognoDB...");
  const ok = await checkConnection();
  if (!ok) {
    console.error(
      "\nCould not connect to CognoDB. Check COGNODB_URI / COGNODB_USER / COGNODB_PASSWORD in .env.local and make sure your instance is running.\n"
    );
    process.exit(1);
  }
  console.log("Connected.\n");

  if (process.argv.includes("--reset")) {
    await reset();
  }

  await createConstraints();
  await loadIngredients();
  await loadCuisines();
  await loadFlavorTags();
  await loadRecipes();
  await loadSubstitutions();
  await loadPairings();

  console.log("\nSeed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDriver();
  });
