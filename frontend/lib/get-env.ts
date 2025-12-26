type BackendEnv = {
  backendUrl: string;
};

/**
 * Server-only env accessor.
 *
 * - Prefer BACKEND_URL (runtime env in Docker).
 * - Fallback to NEXT_PUBLIC_BACKEND_URL for local/dev compatibility.
 * - Final fallback is Docker Compose service DNS.
 */
export function getEnv(): BackendEnv {
  const backendUrl = process.env.BACKEND_URL || "http://backend:8000";

  return { backendUrl };
}
