import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@gunself/types";

type ActionPayload = {
  action?:
    | "generate_demo_users"
    | "cleanup_seed_data"
    | "create_user"
    | "delete_user"
    | "archive_user"
    | "restore_user"
    | "set_admin_password";
  userId?: string;
  email?: string;
  password?: string;
  displayName?: string;
  phone?: string;
  role?: "user" | "admin";
  actorUserId?: string;
  reason?: string;
};
type SeedTable =
  | "workout_exercises"
  | "body_logs"
  | "workouts"
  | "meals"
  | "mood_logs"
  | "skill_logs"
  | "finance_logs"
  | "ai_notes"
  | "goals"
  | "announcements";

const DEMO_USERS = [
  { email: "demo1@gunself.app", password: "Demo@12345", displayName: "Demo One", phone: "+84900010001", role: "user" as const },
  { email: "demo2@gunself.app", password: "Demo@12345", displayName: "Demo Two", phone: "+84900010002", role: "user" as const },
  { email: "demo3@gunself.app", password: "Demo@12345", displayName: "Demo Three", phone: "+84900010003", role: "user" as const },
  { email: "demo4@gunself.app", password: "Demo@12345", displayName: "Demo Four", phone: "+84900010004", role: "user" as const },
  { email: "demo5@gunself.app", password: "Demo@12345", displayName: "Demo Five", phone: "+84900010005", role: "user" as const }
];

const SEED_EMAILS = [
  "admin@gunself.local",
  "alex@gunself.local",
  "mia@gunself.local",
  "noah@gunself.local",
  "lena@gunself.local",
  "admin@gunself.app",
  "alex@gunself.app",
  "mia@gunself.app",
  "noah@gunself.app",
  "lena@gunself.app",
  ...DEMO_USERS.map((u) => u.email),
  ...DEMO_USERS.map((u) => u.email.replace("@gunself.app", "@gunself.local"))
];

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(supabaseUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function assertSuperAdmin(actorUserId?: string) {
  const userId = actorUserId?.trim();
  if (!userId) {
    throw new Error("actorUserId is required for this action.");
  }

  const adminClient = getServiceClient();
  const { data: actor, error } = await adminClient.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle();
  if (error || !actor?.is_super_admin) {
    throw new Error("Only super admin can run this action.");
  }
}

async function appendAuditLog(params: {
  actorUserId?: string;
  targetUserId?: string;
  action: string;
  entity: string;
  message?: string;
  metadata?: Json;
}) {
  const adminClient = getServiceClient();
  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: params.actorUserId ?? null,
    target_user_id: params.targetUserId ?? null,
    action: params.action,
    entity: params.entity,
    message: params.message ?? null,
    metadata: params.metadata ?? {}
  });
}

async function generateDemoUsers(payload: ActionPayload) {
  await assertSuperAdmin(payload.actorUserId);
  const adminClient = getServiceClient();
  let created = 0;
  let upserted = 0;
  const errors: string[] = [];

  for (const demo of DEMO_USERS) {
    const createRes = await adminClient.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: { full_name: demo.displayName }
    });

    if (createRes.error && !createRes.error.message.toLowerCase().includes("already")) {
      errors.push(`${demo.email}: ${createRes.error.message}`);
      continue;
    }

    if (createRes.data.user?.id) {
      created += 1;
    }

    let userId = createRes.data.user?.id;
    if (!userId) {
      const { data: existingProfile, error: existingProfileError } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", demo.email)
        .maybeSingle();

      if (!existingProfileError && existingProfile?.id) {
        userId = existingProfile.id;
      }
    }

    if (!userId) {
      errors.push(`${demo.email}: cannot resolve user id after create`);
      continue;
    }

    const { error: upsertError } = await adminClient.from("profiles").upsert({
      id: userId,
      display_name: demo.displayName,
      email: demo.email,
      phone: demo.phone,
      timezone: "Asia/Bangkok",
      role: demo.role,
      is_banned: false,
      banned_at: null,
      ban_reason: null,
      is_archived: false,
      archived_at: null,
      archived_reason: null
    });

    if (upsertError) {
      errors.push(`${demo.email}: ${upsertError.message}`);
      continue;
    }

    upserted += 1;
  }

  return { created, upserted, errors };
}

async function cleanupSeedData(payload: ActionPayload) {
  await assertSuperAdmin(payload.actorUserId);
  const adminClient = getServiceClient();
  const errors: string[] = [];

  const safeDelete = async (table: SeedTable, column: string, pattern: string) => {
    const { error } = await adminClient.from(table).delete().like(column, pattern);
    if (error && !error.message.toLowerCase().includes("does not exist")) {
      errors.push(`${table}: ${error.message}`);
    }
  };

  await safeDelete("workout_exercises", "exercise_name", "[SEED]%");
  const { data: seedWorkoutRows } = await adminClient.from("workouts").select("id").like("note", "[SEED]%");
  const seedWorkoutIds = (seedWorkoutRows ?? []).map((row) => row.id);
  if (seedWorkoutIds.length > 0) {
    const { error } = await adminClient.from("workout_exercises").delete().in("workout_id", seedWorkoutIds);
    if (error && !error.message.toLowerCase().includes("does not exist")) {
      errors.push(`workout_exercises(workout_id): ${error.message}`);
    }
  }

  await safeDelete("body_logs", "note", "[SEED]%");
  await safeDelete("workouts", "note", "[SEED]%");
  await safeDelete("meals", "title", "[SEED]%");
  await safeDelete("mood_logs", "journal_note", "[SEED]%");
  await safeDelete("skill_logs", "note", "[SEED]%");
  await safeDelete("finance_logs", "note", "[SEED]%");
  await safeDelete("ai_notes", "title", "[SEED]%");
  await safeDelete("goals", "title", "[SEED]%");
  await safeDelete("announcements", "title", "[SEED]%");

  const { data: seedProfiles } = await adminClient.from("profiles").select("id").in("email", SEED_EMAILS);
  const ids = (seedProfiles ?? []).map((row) => row.id);

  for (const userId of ids) {
    await adminClient.auth.admin.deleteUser(userId);
  }

  return { deletedUsers: ids.length, errors };
}

async function createUser(payload: ActionPayload) {
  if (payload.role === "admin") {
    await assertSuperAdmin(payload.actorUserId);
  }

  const adminClient = getServiceClient();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const displayName = payload.displayName?.trim();
  const phone = payload.phone?.trim() || null;
  const role = payload.role === "admin" ? "admin" : "user";

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const createRes = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: displayName ? { full_name: displayName } : undefined
  });

  if (createRes.error || !createRes.data.user?.id) {
    throw new Error(createRes.error?.message ?? "Failed to create auth user.");
  }

  const userId = createRes.data.user.id;
  const { error: upsertError } = await adminClient.from("profiles").upsert({
    id: userId,
    display_name: displayName || email.split("@")[0],
    email,
    phone,
    timezone: "Asia/Bangkok",
    role,
    is_banned: false,
    banned_at: null,
    ban_reason: null,
    is_archived: false,
    archived_at: null,
    archived_reason: null
  });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  await appendAuditLog({
    actorUserId: payload.actorUserId,
    targetUserId: userId,
    action: "create",
    entity: "user",
    message: `Created ${role} account ${email}`,
    metadata: { email, role }
  });

  return { userId, email, role };
}

async function deleteUser(payload: ActionPayload) {
  await assertSuperAdmin(payload.actorUserId);
  const adminClient = getServiceClient();
  const userId = payload.userId?.trim();

  if (!userId) {
    throw new Error("userId is required.");
  }

  const { data: profile } = await adminClient.from("profiles").select("email,display_name").eq("id", userId).maybeSingle();
  const targetLabel = profile?.email ?? profile?.display_name ?? userId;

  const deleteRes = await adminClient.auth.admin.deleteUser(userId);
  if (deleteRes.error) {
    throw new Error(deleteRes.error.message);
  }

  await appendAuditLog({
    actorUserId: payload.actorUserId,
    targetUserId: userId,
    action: "delete",
    entity: "user",
    message: `Deleted user ${targetLabel}`,
    metadata: { targetLabel }
  });

  return { deleted: true, userId };
}

async function archiveUser(payload: ActionPayload) {
  const adminClient = getServiceClient();
  const userId = payload.userId?.trim();

  if (!userId) {
    throw new Error("userId is required.");
  }

  const reason = payload.reason?.trim() || "Archived by admin";
  const { error } = await adminClient
    .from("profiles")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_reason: reason
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await appendAuditLog({
    actorUserId: payload.actorUserId,
    targetUserId: userId,
    action: "archive",
    entity: "user",
    message: `Archived user ${userId}`,
    metadata: { reason }
  });

  return { archived: true, userId };
}

async function restoreUser(payload: ActionPayload) {
  const adminClient = getServiceClient();
  const userId = payload.userId?.trim();

  if (!userId) {
    throw new Error("userId is required.");
  }

  const { error } = await adminClient
    .from("profiles")
    .update({
      is_archived: false,
      archived_at: null,
      archived_reason: null
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await appendAuditLog({
    actorUserId: payload.actorUserId,
    targetUserId: userId,
    action: "restore",
    entity: "user",
    message: `Restored user ${userId}`,
    metadata: {}
  });

  return { restored: true, userId };
}

async function setAdminPassword(payload: ActionPayload) {
  await assertSuperAdmin(payload.actorUserId);
  const adminClient = getServiceClient();
  const userId = payload.userId?.trim();
  const password = payload.password?.trim();

  if (!userId) {
    throw new Error("userId is required.");
  }
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role,is_super_admin,email")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Target profile not found.");
  }
  if (profile.role !== "admin") {
    throw new Error("Only admin accounts can be updated by this action.");
  }

  const updateRes = await adminClient.auth.admin.updateUserById(userId, { password });
  if (updateRes.error) {
    throw new Error(updateRes.error.message);
  }

  await appendAuditLog({
    actorUserId: payload.actorUserId,
    targetUserId: userId,
    action: "set_admin_password",
    entity: "user",
    message: `Super admin reset password for admin ${profile.email ?? userId}`,
    metadata: {
      role: profile.role,
      is_super_admin: profile.is_super_admin
    }
  });

  return { updated: true, userId };
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as ActionPayload;
    if (body.action === "generate_demo_users") {
      const result = await generateDemoUsers(body);
      return NextResponse.json({ ok: true, result });
    }

    if (body.action === "cleanup_seed_data") {
      const result = await cleanupSeedData(body);
      return NextResponse.json({ ok: true, result });
    }

    if (body.action === "create_user") {
      const result = await createUser(body);
      return NextResponse.json({ ok: true, result });
    }

    if (body.action === "delete_user") {
      const result = await deleteUser(body);
      return NextResponse.json({ ok: true, result });
    }

    if (body.action === "archive_user") {
      const result = await archiveUser(body);
      return NextResponse.json({ ok: true, result });
    }

    if (body.action === "restore_user") {
      const result = await restoreUser(body);
      return NextResponse.json({ ok: true, result });
    }

    if (body.action === "set_admin_password") {
      const result = await setAdminPassword(body);
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
