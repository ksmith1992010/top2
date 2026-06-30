import { checkDbConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const connected = await checkDbConnection();

  if (!connected) {
    return Response.json({ status: "error", db: "disconnected" }, { status: 503 });
  }

  return Response.json({ status: "ok", db: "connected" });
}
