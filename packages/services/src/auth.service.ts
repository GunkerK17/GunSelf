import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

export function createAuthService(client: SupabaseClient<Database>) {
  return {
    signInWithPassword: (email: string, password: string) => client.auth.signInWithPassword({ email, password }),
    signUpWithPassword: (email: string, password: string) => client.auth.signUp({ email, password }),
    signOut: () => client.auth.signOut(),
    getSession: () => client.auth.getSession()
  };
}
