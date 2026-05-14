import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createMoodService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("mood_logs").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["mood_logs"]["Insert"]) => client.from("mood_logs").insert(payload)
  };
}
