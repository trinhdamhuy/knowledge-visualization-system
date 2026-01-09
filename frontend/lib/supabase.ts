import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./get-env";

function getSupabase() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
  );
}

export { getSupabase };
