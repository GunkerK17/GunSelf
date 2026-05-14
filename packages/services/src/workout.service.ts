import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createWorkoutService(client: SupabaseClient<Database>) {
  return {
    list: () => client.from("workouts").select("*").order("created_at", { ascending: false }),
    create: (payload: Database["public"]["Tables"]["workouts"]["Insert"]) => client.from("workouts").insert(payload)
  };
}
