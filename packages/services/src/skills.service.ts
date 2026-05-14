import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createSkillsService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("skill_logs").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["skill_logs"]["Insert"]) => client.from("skill_logs").insert(payload)
  };
}
