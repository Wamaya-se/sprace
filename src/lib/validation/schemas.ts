/**
 * Central Zod schemas used by multiple actions. Re-exported from action modules
 * so individual callers keep their current imports working.
 *
 * Keep this file free of server-only dependencies so it can be unit-tested.
 */
import { z } from 'zod'

export const uuidSchema = z.string().uuid()

export const createBookingSchema = z.object({
	creatorId: z.string().uuid(),
	serviceId: z.string().uuid().optional(),
	title: z.string().min(1).max(200).trim(),
	description: z.string().min(1).max(5000).trim(),
	budget: z.coerce.number().positive().max(10_000_000).optional(),
	deadline: z.string().date().optional(),
})

export const bookingStatusSchema = z.enum([
	'pending',
	'awaiting_payment',
	'accepted',
	'in_progress',
	'delivered',
	'completed',
	'declined',
	'cancelled',
	'disputed',
])

export const createReviewSchema = z.object({
	bookingId: z.string().uuid(),
	rating: z.coerce.number().int().min(1).max(5),
	comment: z.string().max(2000).trim().optional(),
})

export const openDisputeSchema = z.object({
	bookingId: z.string().uuid(),
	reason: z.string().min(10).max(2000).trim(),
})
