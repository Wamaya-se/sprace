import { z } from 'zod'

export const BROADCAST_AUDIENCES = ['all', 'creators', 'businesses'] as const
export type BroadcastAudience = (typeof BROADCAST_AUDIENCES)[number]

export const BROADCAST_STATUSES = ['draft', 'sent'] as const
export type BroadcastStatus = (typeof BROADCAST_STATUSES)[number]

const trimmedString = (min: number, max: number) =>
	z.string().trim().min(min).max(max)

const optionalLink = z.preprocess(
	(v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
	z.string().trim().url().max(500).optional(),
)

export const createBroadcastSchema = z.object({
	title: trimmedString(3, 200),
	body: trimmedString(10, 4000),
	audience: z.enum(BROADCAST_AUDIENCES),
	link: optionalLink,
})

export const sendBroadcastSchema = z.object({
	broadcastId: z.string().uuid(),
})

export const AUDIT_ACTIONS = [
	'user.role_changed',
	'user.deleted',
	'user.suspended',
	'user.unsuspended',
	'creator.status_changed',
	'business.org_verified',
	'dispute.resolved',
	'report.resolved',
	'report.dismissed',
	'report.reviewing',
	'broadcast.sent',
	'platform_settings.updated',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export const auditLogFiltersSchema = z.object({
	action: z.enum(AUDIT_ACTIONS).optional(),
	actorId: z.string().uuid().optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50),
	offset: z.coerce.number().int().min(0).default(0),
})
