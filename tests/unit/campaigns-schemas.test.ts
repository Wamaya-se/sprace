import { describe, expect, it } from 'vitest'

import {
	applyCampaignSchema,
	applicationStatusSchema,
	campaignStatusSchema,
	createCampaignSchema,
} from '@/lib/validation/campaigns'
import { generateCampaignSlug, __test } from '@/lib/campaigns/slug'

describe('createCampaignSchema', () => {
	const validBase = {
		title: 'Summer collab with 5 creators',
		description:
			'We need authentic creators to share our summer collection in a natural way.',
	}

	it('accepts a minimal valid payload', () => {
		const parsed = createCampaignSchema.safeParse(validBase)
		expect(parsed.success).toBe(true)
	})

	it('rejects a title that is too short', () => {
		const parsed = createCampaignSchema.safeParse({
			...validBase,
			title: 'hi',
		})
		expect(parsed.success).toBe(false)
	})

	it('rejects a description that is too short', () => {
		const parsed = createCampaignSchema.safeParse({
			...validBase,
			description: 'too short',
		})
		expect(parsed.success).toBe(false)
	})

	it('coerces numeric budget strings', () => {
		const parsed = createCampaignSchema.safeParse({
			...validBase,
			budgetPerCreator: '2500',
			totalBudget: '25000',
		})
		expect(parsed.success).toBe(true)
		if (parsed.success) {
			expect(parsed.data.budgetPerCreator).toBe(2500)
			expect(parsed.data.totalBudget).toBe(25000)
		}
	})

	it('rejects negative budgets', () => {
		const parsed = createCampaignSchema.safeParse({
			...validBase,
			budgetPerCreator: -100,
		})
		expect(parsed.success).toBe(false)
	})

	it('defaults specialtyIds and marketIds to empty arrays', () => {
		const parsed = createCampaignSchema.safeParse(validBase)
		expect(parsed.success).toBe(true)
		if (parsed.success) {
			expect(parsed.data.specialtyIds).toEqual([])
			expect(parsed.data.marketIds).toEqual([])
		}
	})

	it('rejects more than 10 specialty ids', () => {
		const parsed = createCampaignSchema.safeParse({
			...validBase,
			specialtyIds: Array.from(
				{ length: 11 },
				() => '550e8400-e29b-41d4-a716-446655440000',
			),
		})
		expect(parsed.success).toBe(false)
	})
})

describe('applyCampaignSchema', () => {
	const validPayload = {
		campaignId: '550e8400-e29b-41d4-a716-446655440000',
		pitch: 'I would love to collaborate on this brief and bring my audience.',
	}

	it('accepts a minimal valid application', () => {
		const parsed = applyCampaignSchema.safeParse(validPayload)
		expect(parsed.success).toBe(true)
	})

	it('rejects a pitch that is too short', () => {
		const parsed = applyCampaignSchema.safeParse({
			...validPayload,
			pitch: 'too short',
		})
		expect(parsed.success).toBe(false)
	})

	it('rejects invalid campaign id', () => {
		const parsed = applyCampaignSchema.safeParse({
			...validPayload,
			campaignId: 'not-a-uuid',
		})
		expect(parsed.success).toBe(false)
	})

	it('coerces proposedPrice from string', () => {
		const parsed = applyCampaignSchema.safeParse({
			...validPayload,
			proposedPrice: '1500',
		})
		expect(parsed.success).toBe(true)
		if (parsed.success) {
			expect(parsed.data.proposedPrice).toBe(1500)
		}
	})
})

describe('campaign status enums', () => {
	it('accepts all known campaign statuses', () => {
		expect(campaignStatusSchema.safeParse('open').success).toBe(true)
		expect(campaignStatusSchema.safeParse('cancelled').success).toBe(true)
	})

	it('rejects unknown campaign status', () => {
		expect(campaignStatusSchema.safeParse('archived').success).toBe(false)
	})

	it('accepts all known application statuses', () => {
		expect(applicationStatusSchema.safeParse('pending').success).toBe(true)
		expect(applicationStatusSchema.safeParse('withdrawn').success).toBe(true)
	})

	it('rejects unknown application status', () => {
		expect(applicationStatusSchema.safeParse('approved').success).toBe(false)
	})
})

describe('generateCampaignSlug', () => {
	it('lowercases and strips diacritics', () => {
		expect(__test.baseSlug('Vårkampanj för skönhet')).toBe(
			'varkampanj-for-skonhet',
		)
	})

	it('produces a slug with a random suffix of expected length', () => {
		const slug = generateCampaignSlug('Summer Collab')
		expect(slug.startsWith('summer-collab-')).toBe(true)
		const suffix = slug.slice('summer-collab-'.length)
		expect(suffix).toHaveLength(6)
		expect(suffix).toMatch(/^[a-z0-9]+$/)
	})

	it('falls back to "campaign" for an unusable title', () => {
		const slug = generateCampaignSlug('!!!')
		expect(slug.startsWith('campaign-')).toBe(true)
	})
})
