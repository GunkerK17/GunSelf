import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createActivityService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("activity_logs").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["activity_logs"]["Insert"]) => client.from("activity_logs").insert(payload)
  };
}
