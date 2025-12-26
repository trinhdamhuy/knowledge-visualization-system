import { getEnv } from "@/lib/get-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { backendUrl } = getEnv();

  const upstream = await fetch(`${backendUrl}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
    body: await request.text(),
    // Ensure cookies/credentials (if any) can pass through later
    cache: "no-store",
  });

  // Pass-through status + streaming body.
  // Keep Content-Type as text/event-stream so the browser treats it as SSE-like stream.
  const headers = new Headers(upstream.headers);
  headers.set("cache-control", "no-cache");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
