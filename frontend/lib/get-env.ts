/**
 * Server-only env accessor.
 *
 */
export function getEnv(key: string): string {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return process.env[key]!;
}
