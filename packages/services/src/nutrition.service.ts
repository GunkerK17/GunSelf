import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createNutritionService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("meals").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["meals"]["Insert"]) => client.from("meals").insert(payload)
  };
}
