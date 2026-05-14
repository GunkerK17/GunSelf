import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createFinanceService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("finance_logs").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["finance_logs"]["Insert"]) => client.from("finance_logs").insert(payload)
  };
}
