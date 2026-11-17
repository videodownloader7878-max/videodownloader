import { createClient } from "@/lib/supabase/server";
type Sb = ReturnType<typeof createClient>;
// Insert is allowed by RLS only for staff and only with actor_id = the signed-in user.
export async function logActivity(sb: Sb, actorId: string, action: string, entityType?: string, entityId?: string, details: Record<string, unknown> = {}) {
  await sb.from("activity_logs").insert({ actor_id: actorId, action, entity_type: entityType ?? null, entity_id: entityId ?? null, details });
}
