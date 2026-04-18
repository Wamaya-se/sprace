import 'server-only'

import type { Database, Json } from '@/types/supabase'
import { createServiceClient } from '@/lib/supabase/service'

export type AuditAction = Database['public']['Enums']['audit_action']

export interface AuditEventInput {
	actorId: string | null
	action: AuditAction
	targetType?: string
	targetId?: string | null
	metadata?: Record<string, unknown>
}

/**
 * Append an immutable entry to the admin audit log.
 *
 * Failures are swallowed (logged to stderr) so we never block the
 * triggering admin action. The audit log is a best-effort trail —
 * if we ever need stronger guarantees we can upgrade this to a
 * transactional outbox, but today it's structured logging in Postgres.
 *
 * Uses the service-role client because the RLS policies only permit
 * SELECT to admins and explicitly deny all other mutations — inserts
 * are gated by trusted server-side code.
 */
export async function logAuditEvent(event: AuditEventInput): Promise<void> {
	try {
		const supabase = createServiceClient()
		const { error } = await supabase.from('admin_audit_log').insert({
			actor_id: event.actorId,
			action: event.action,
			target_type: event.targetType ?? null,
			target_id: event.targetId ?? null,
			metadata: (event.metadata ?? {}) as Json,
		})
		if (error) {
			console.error('[logAuditEvent]', error)
		}
	} catch (err) {
		console.error('[logAuditEvent] unexpected', err)
	}
}
