/**
 * Central Zod schemas for campaign management.
 *
 * Keep this file free of server-only dependencies so it can be imported
 * both from Server Actions and unit tests.
 */
import { z } from 'zod'

const uuid = z.string().uuid()

export const createCampaignSchema = z.object({
	title: z.string().min(5).max(200).trim(),
	description: z.string().min(20).max(10_000).trim(),
	budgetPerCreator: z.coerce.number().positive().max(10_000_000).optional(),
	totalBudget: z.coerce.number().positive().max(100_000_000).optional(),
	deadline: z.string().date().optional(),
	specialtyIds: z.array(uuid).max(10).default([]),
	marketIds: z.array(uuid).max(10).default([]),
})

export const updateCampaignSchema = createCampaignSchema.partial()

export const applyCampaignSchema = z.object({
	campaignId: uuid,
	pitch: z.string().min(20).max(2000).trim(),
	proposedPrice: z.coerce.number().positive().max(10_000_000).optional(),
})

export const applicationIdSchema = uuid
export const campaignIdSchema = uuid

export const campaignStatusSchema = z.enum([
	'draft',
	'open',
	'closed',
	'completed',
	'cancelled',
])

export const applicationStatusSchema = z.enum([
	'pending',
	'shortlisted',
	'accepted',
	'declined',
	'withdrawn',
])
