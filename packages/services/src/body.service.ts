import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createBodyService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("body_logs").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["body_logs"]["Insert"]) => client.from("body_logs").insert(payload)
  };
}
