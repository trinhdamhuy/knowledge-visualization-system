import "server-only";
import { Liveblocks } from "@liveblocks/node";

let cached: Liveblocks | null = null;

/**
 * Lazily create the Liveblocks server SDK client.
 *
 * Important: Don't read env / throw at module import time, because Next.js may
 * evaluate server modules during build. We only require the secret at runtime
 * when a request/action actually uses Liveblocks.
 */
export function getLiveblocks(): Liveblocks {
  if (typeof window !== "undefined") {
    throw new Error(
      "Liveblocks service should only be used on the server side"
    );
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }

  if (!cached) {
    cached = new Liveblocks({ secret });
  }

  return cached;
}
