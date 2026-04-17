import { z } from 'zod'

export const REPORT_CATEGORIES = [
	'spam',
	'fraud',
	'harassment',
	'inappropriate',
	'other',
] as const

export const REPORT_TARGET_TYPES = ['profile', 'booking'] as const

export const createReportSchema = z.object({
	targetType: z.enum(REPORT_TARGET_TYPES),
	targetId: z.string().uuid(),
	category: z.enum(REPORT_CATEGORIES),
	reason: z.string().min(10).max(2000).trim(),
})

export type CreateReportInput = z.input<typeof createReportSchema>

export const resolveReportSchema = z.object({
	status: z.enum(['reviewing', 'resolved', 'dismissed']),
	adminNote: z.string().max(2000).trim().optional(),
})

export type ResolveReportInput = z.input<typeof resolveReportSchema>

export const suspendUserSchema = z.object({
	reason: z.string().min(5).max(2000).trim(),
})

export type SuspendUserInput = z.input<typeof suspendUserSchema>
