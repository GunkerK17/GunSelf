export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type UserOwnedTable<T extends Record<string, unknown>> = {
  Row: T & {
    id: string;
    user_id: string;
    created_at: string;
  };
  Insert: Partial<T> & {
    user_id: string;
    id?: string;
    created_at?: string;
  };
  Update: Partial<T> & {
    id?: string;
    user_id?: string;
    created_at?: string;
  };
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      body_logs: UserOwnedTable<{
        weight_kg: number | null;
        body_fat_percent: number | null;
        note: string | null;
        logged_at: string;
      }>;
      workouts: UserOwnedTable<{
        name: string;
        duration_minutes: number | null;
        calories_burned: number | null;
        note: string | null;
        logged_at: string;
      }>;
      workout_exercises: UserOwnedTable<{
        workout_id: string;
        exercise_id: string | null;
        exercise_name: string;
        sets: number | null;
        reps: number | null;
        weight_kg: number | null;
        duration_seconds: number | null;
      }>;
      exercise_library: UserOwnedTable<{
        name: string;
        category: string | null;
        muscle_group: string | null;
      }>;
      meals: UserOwnedTable<{
        meal_type: string | null;
        title: string;
        calories: number | null;
        protein_g: number | null;
        carbs_g: number | null;
        fat_g: number | null;
        logged_at: string;
      }>;
      activity_logs: UserOwnedTable<{
        activity_type: string;
        duration_minutes: number | null;
        distance_km: number | null;
        steps: number | null;
        logged_at: string;
      }>;
      sleep_logs: UserOwnedTable<{
        sleep_start: string | null;
        sleep_end: string | null;
        duration_minutes: number | null;
        quality_score: number | null;
      }>;
      mood_logs: UserOwnedTable<{
        mood_score: number | null;
        energy_score: number | null;
        stress_score: number | null;
        journal_note: string | null;
        logged_at: string;
      }>;
      goals: UserOwnedTable<{
        title: string;
        description: string | null;
        target_value: number | null;
        current_value: number | null;
        unit: string | null;
        status: string | null;
        due_date: string | null;
      }>;
      skill_logs: UserOwnedTable<{
        skill_name: string;
        duration_minutes: number | null;
        level: string | null;
        note: string | null;
        logged_at: string;
      }>;
      finance_logs: UserOwnedTable<{
        type: string;
        category: string | null;
        amount: number;
        currency: string | null;
        note: string | null;
        logged_at: string;
      }>;
      ai_notes: UserOwnedTable<{
        title: string | null;
        content: string;
        context: string | null;
      }>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
