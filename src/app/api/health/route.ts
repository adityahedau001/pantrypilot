import { NextResponse } from "next/server";
import { checkConnection } from "@/lib/db";

export async function GET() {
  const connected = await checkConnection();
  return NextResponse.json(
    { connected },
    { status: connected ? 200 : 503 }
  );
}
