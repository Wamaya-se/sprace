import 'server-only'

import { cache } from 'react'
import { requireAdmin } from '@/lib/auth/guards'
import type { Database } from '@/types/supabase'

export type AuditActionValue = Database['public']['Enums']['audit_action']

export interface AuditLogEntry {
	id: string
	action: AuditActionValue
	target_type: string | null
	target_id: string | null
	metadata: Record<string, unknown>
	created_at: string
	actor: {
		id: string
		full_name: string | null
		email: string | null
	} | null
}

export interface ListAuditLogParams {
	action?: AuditActionValue
	actorId?: string
	limit?: number
	offset?: number
}

export interface AuditLogPage {
	items: AuditLogEntry[]
	total: number
}

export const listAuditLog = cache(
	async ({
		action,
		actorId,
		limit = 50,
		offset = 0,
	}: ListAuditLogParams): Promise<AuditLogPage> => {
		const { supabase } = await requireAdmin()

		let query = supabase
			.from('admin_audit_log')
			.select(
				`id, action, target_type, target_id, metadata, created_at,
				 actor:profiles!admin_audit_log_actor_id_fkey(id, full_name, email)`,
				{ count: 'exact' },
			)
			.order('created_at', { ascending: false })

		if (action) query = query.eq('action', action)
		if (actorId) query = query.eq('actor_id', actorId)

		const { data, error, count } = await query.range(offset, offset + limit - 1)

		if (error) {
			console.error('[listAuditLog]', error)
			return { items: [], total: 0 }
		}

		const items: AuditLogEntry[] = (data ?? []).map((row) => {
			const actor = Array.isArray(row.actor)
				? (row.actor[0] ?? null)
				: (row.actor ?? null)
			return {
				id: row.id,
				action: row.action,
				target_type: row.target_type,
				target_id: row.target_id,
				metadata: (row.metadata ?? {}) as Record<string, unknown>,
				created_at: row.created_at,
				actor: actor
					? {
							id: actor.id,
							full_name: actor.full_name,
							email: actor.email,
						}
					: null,
			}
		})

		return { items, total: count ?? 0 }
	},
)
