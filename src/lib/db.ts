import neo4j, { Driver, Session, SessionMode } from "neo4j-driver";

/**
 * Singleton Bolt driver for CognoDB (openCypher over Bolt 5.x, Neo4j-compatible).
 * Connection details are read exclusively from environment variables — never
 * hardcode credentials here or commit them anywhere in the repo.
 */

let driver: Driver | null = null;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env.local and fill in your CognoDB connection details.`
    );
  }
  return value;
}

export function getDriver(): Driver {
  if (driver) return driver;

  const uri = getEnv("COGNODB_URI"); // e.g. bolt+s://<instance-id>.databases.cognodb.cloud
  const user = getEnv("COGNODB_USER"); // "cognodb"
  const password = getEnv("COGNODB_PASSWORD");

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 20,
    connectionAcquisitionTimeout: 10_000,
    maxTransactionRetryTime: 15_000,
  });

  return driver;
}

/** Custom error so API routes can distinguish "DB unreachable" from bugs and return a clean 503. */
export class DatabaseUnavailableError extends Error {
  constructor(cause: unknown) {
    super(
      "Could not reach the CognoDB instance. It may be paused, unreachable, or the connection details may be wrong."
    );
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

async function withSession<T>(
  mode: SessionMode,
  work: (session: Session) => Promise<T>
): Promise<T> {
  let session: Session;
  try {
    session = getDriver().session({ defaultAccessMode: mode });
  } catch (err) {
    throw new DatabaseUnavailableError(err);
  }

  try {
    return await work(session);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "";
    const message = err instanceof Error ? err.message : String(err);
    if (
      code.includes("ServiceUnavailable") ||
      code.includes("SessionExpired") ||
      /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|WebSocket|connect/i.test(message)
    ) {
      throw new DatabaseUnavailableError(err);
    }
    throw err;
  } finally {
    await session.close();
  }
}

/** Run a read-only, parameterised Cypher query. Never string-concatenate Cypher — always pass params. */
export async function runRead<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withSession("READ", async (session) => {
    const result = await session.executeRead((tx) => tx.run(cypher, params));
    return result.records.map((r) => r.toObject() as T);
  });
}

/** Run a write Cypher query (used only by the seed script). */
export async function runWrite<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withSession("WRITE", async (session) => {
    const result = await session.executeWrite((tx) => tx.run(cypher, params));
    return result.records.map((r) => r.toObject() as T);
  });
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export async function checkConnection(): Promise<boolean> {
  try {
    await runRead("RETURN 1 AS ok");
    return true;
  } catch {
    return false;
  }
}
