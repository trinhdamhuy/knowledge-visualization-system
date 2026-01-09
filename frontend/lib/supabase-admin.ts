import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./get-env";

function getSupabaseAdmin() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
  );
}

export { getSupabaseAdmin };
