import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createSleepService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("sleep_logs").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["sleep_logs"]["Insert"]) => client.from("sleep_logs").insert(payload)
  };
}
