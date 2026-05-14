import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createGoalsService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("goals").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["goals"]["Insert"]) => client.from("goals").insert(payload)
  };
}
