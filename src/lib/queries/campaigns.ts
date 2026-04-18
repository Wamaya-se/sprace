import 'server-only'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type CampaignStatus = Database['public']['Enums']['campaign_status']
type ApplicationStatus = Database['public']['Enums']['application_status']

export interface CampaignSpecialtyRef {
	id: string
	name: string
	slug: string
}

export interface CampaignMarketRef {
	id: string
	name: string
	slug: string
	flag_emoji: string | null
}

export interface PublicCampaignListItem {
	id: string
	slug: string
	title: string
	description: string
	budget_per_creator: number | null
	total_budget: number | null
	deadline: string | null
	status: CampaignStatus
	published_at: string | null
	company_name: string
	specialties: CampaignSpecialtyRef[]
	markets: CampaignMarketRef[]
	application_count: number
}

export interface CampaignListItem extends PublicCampaignListItem {
	created_at: string
	booking_count: number
}

export interface CampaignDetail extends CampaignListItem {
	description: string
	business_id: string
	business: {
		id: string
		profile_id: string
		company_name: string
	}
}

export interface CampaignApplicationListItem {
	id: string
	status: ApplicationStatus
	pitch: string
	proposed_price: number | null
	booking_id: string | null
	created_at: string
	creator: {
		id: string
		profile_id: string
		display_name: string
		slug: string | null
		avatar_url: string | null
		bio: string | null
		followers_count: number | null
		hourly_rate: number | null
	}
	conversation_id: string | null
}

export interface CreatorApplicationListItem {
	id: string
	status: ApplicationStatus
	pitch: string
	proposed_price: number | null
	booking_id: string | null
	created_at: string
	campaign: {
		id: string
		slug: string
		title: string
		status: CampaignStatus
		budget_per_creator: number | null
		deadline: string | null
		business: {
			company_name: string
		} | null
	}
}

interface PublicFilters {
	q?: string
	specialtySlugs?: string[]
	marketSlugs?: string[]
	minBudget?: number
	maxBudget?: number
	limit?: number
	offset?: number
}

type CampaignJoin = {
	id: string
	slug: string
	title: string
	description: string
	budget_per_creator: number | null
	total_budget: number | null
	deadline: string | null
	status: CampaignStatus
	published_at: string | null
	created_at: string
	business_id: string
	business:
		| { id: string; profile_id: string; company_name: string }
		| { id: string; profile_id: string; company_name: string }[]
		| null
	campaign_specialties:
		| { specialty: { id: string; name: string; slug: string } | null }[]
		| null
	campaign_markets:
		| {
				market: {
					id: string
					name: string
					slug: string
					flag_emoji: string | null
				} | null
		  }[]
		| null
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
	if (!value) return null
	if (Array.isArray(value)) return value[0] ?? null
	return value
}

function mapCampaignRow(
	row: CampaignJoin,
	counts: { applicationCount: number; bookingCount: number },
): CampaignListItem {
	const business = pickOne(row.business)
	const specialties = (row.campaign_specialties ?? [])
		.map((cs) => cs.specialty)
		.filter((s): s is CampaignSpecialtyRef => Boolean(s))
	const markets = (row.campaign_markets ?? [])
		.map((cm) => cm.market)
		.filter((m): m is CampaignMarketRef => Boolean(m))

	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description,
		budget_per_creator: row.budget_per_creator,
		total_budget: row.total_budget,
		deadline: row.deadline,
		status: row.status,
		published_at: row.published_at,
		created_at: row.created_at,
		company_name: business?.company_name ?? '',
		specialties,
		markets,
		application_count: counts.applicationCount,
		booking_count: counts.bookingCount,
	}
}

const CAMPAIGN_SELECT = `
	id, slug, title, description, budget_per_creator, total_budget,
	deadline, status, published_at, created_at, business_id,
	business:businesses!campaigns_business_id_fkey(id, profile_id, company_name),
	campaign_specialties(specialty:specialties(id, name, slug)),
	campaign_markets(market:markets(id, name, slug, flag_emoji))
`

async function attachCounts(
	supabase: Awaited<ReturnType<typeof createClient>>,
	rows: CampaignJoin[],
): Promise<CampaignListItem[]> {
	if (rows.length === 0) return []
	const ids = rows.map((r) => r.id)

	const [applicationsRes, bookingsRes] = await Promise.all([
		supabase
			.from('campaign_applications')
			.select('campaign_id')
			.in('campaign_id', ids)
			.not('status', 'eq', 'withdrawn'),
		supabase.from('bookings').select('campaign_id').in('campaign_id', ids),
	])

	const appCounts = new Map<string, number>()
	applicationsRes.data?.forEach((row) => {
		appCounts.set(row.campaign_id, (appCounts.get(row.campaign_id) ?? 0) + 1)
	})

	const bookingCounts = new Map<string, number>()
	bookingsRes.data?.forEach((row) => {
		const id = row.campaign_id
		if (!id) return
		bookingCounts.set(id, (bookingCounts.get(id) ?? 0) + 1)
	})

	return rows.map((row) =>
		mapCampaignRow(row, {
			applicationCount: appCounts.get(row.id) ?? 0,
			bookingCount: bookingCounts.get(row.id) ?? 0,
		}),
	)
}

export const getPublicCampaigns = cache(
	async (filters: PublicFilters = {}): Promise<PublicCampaignListItem[]> => {
		const supabase = await createClient()

		let query = supabase
			.from('campaigns')
			.select(CAMPAIGN_SELECT)
			.eq('status', 'open')
			.order('published_at', { ascending: false, nullsFirst: false })
			.limit(filters.limit ?? 48)

		if (filters.offset) {
			query = query.range(
				filters.offset,
				filters.offset + (filters.limit ?? 48) - 1,
			)
		}

		if (filters.q) {
			const pattern = `%${filters.q.replace(/[%_]/g, (c) => `\\${c}`)}%`
			query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
		}
		if (typeof filters.minBudget === 'number') {
			query = query.gte('budget_per_creator', filters.minBudget)
		}
		if (typeof filters.maxBudget === 'number') {
			query = query.lte('budget_per_creator', filters.maxBudget)
		}

		const { data, error } = await query

		if (error) {
			console.error('[getPublicCampaigns]', error)
			return []
		}
		if (!data) return []

		const rows = data as unknown as CampaignJoin[]

		let filtered = rows
		if (filters.specialtySlugs && filters.specialtySlugs.length > 0) {
			const set = new Set(filters.specialtySlugs)
			filtered = filtered.filter((row) =>
				(row.campaign_specialties ?? []).some((cs) =>
					cs.specialty ? set.has(cs.specialty.slug) : false,
				),
			)
		}
		if (filters.marketSlugs && filters.marketSlugs.length > 0) {
			const set = new Set(filters.marketSlugs)
			filtered = filtered.filter((row) =>
				(row.campaign_markets ?? []).some((cm) =>
					cm.market ? set.has(cm.market.slug) : false,
				),
			)
		}

		return attachCounts(supabase, filtered)
	},
)

export const getCampaignBySlug = cache(
	async (slug: string): Promise<CampaignDetail | null> => {
		const supabase = await createClient()
		const { data, error } = await supabase
			.from('campaigns')
			.select(CAMPAIGN_SELECT)
			.eq('slug', slug)
			.single()

		if (error || !data) return null

		const row = data as unknown as CampaignJoin
		const [withCounts] = await attachCounts(supabase, [row])
		const business = pickOne(row.business)
		if (!withCounts || !business) return null

		return {
			...withCounts,
			business_id: row.business_id,
			business,
		}
	},
)

export const getCampaignById = cache(
	async (id: string): Promise<CampaignDetail | null> => {
		const supabase = await createClient()
		const { data, error } = await supabase
			.from('campaigns')
			.select(CAMPAIGN_SELECT)
			.eq('id', id)
			.single()

		if (error || !data) return null

		const row = data as unknown as CampaignJoin
		const [withCounts] = await attachCounts(supabase, [row])
		const business = pickOne(row.business)
		if (!withCounts || !business) return null

		return {
			...withCounts,
			business_id: row.business_id,
			business,
		}
	},
)

export const getBusinessCampaigns = cache(
	async (
		businessId: string,
		statusFilter?: CampaignStatus,
	): Promise<CampaignListItem[]> => {
		const supabase = await createClient()
		let query = supabase
			.from('campaigns')
			.select(CAMPAIGN_SELECT)
			.eq('business_id', businessId)
			.order('created_at', { ascending: false })

		if (statusFilter) {
			query = query.eq('status', statusFilter)
		}

		const { data, error } = await query

		if (error) {
			console.error('[getBusinessCampaigns]', error)
			return []
		}
		if (!data) return []

		return attachCounts(supabase, data as unknown as CampaignJoin[])
	},
)

export const getCampaignApplications = cache(
	async (campaignId: string): Promise<CampaignApplicationListItem[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase
			.from('campaign_applications')
			.select(
				`id, status, pitch, proposed_price, booking_id, created_at,
				creator:creators!campaign_applications_creator_id_fkey(
					id, profile_id, display_name, slug, bio, followers_count, hourly_rate,
					profile:profiles!creators_profile_id_fkey(avatar_url)
				)`,
			)
			.eq('campaign_id', campaignId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('[getCampaignApplications]', error)
			return []
		}
		if (!data) return []

		const ids = data.map((row) => row.id)
		const { data: conversations } = await supabase
			.from('conversations')
			.select('id, application_id')
			.in('application_id', ids)

		const convByApp = new Map<string, string>()
		conversations?.forEach((c) => {
			if (c.application_id) convByApp.set(c.application_id, c.id)
		})

		return data.map((row) => {
			const creator = row.creator as unknown as {
				id: string
				profile_id: string
				display_name: string
				slug: string | null
				bio: string | null
				followers_count: number | null
				hourly_rate: number | null
				profile: { avatar_url: string | null } | null
			} | null

			return {
				id: row.id,
				status: row.status,
				pitch: row.pitch,
				proposed_price: row.proposed_price,
				booking_id: row.booking_id,
				created_at: row.created_at,
				creator: {
					id: creator?.id ?? '',
					profile_id: creator?.profile_id ?? '',
					display_name: creator?.display_name ?? '',
					slug: creator?.slug ?? null,
					avatar_url: creator?.profile?.avatar_url ?? null,
					bio: creator?.bio ?? null,
					followers_count: creator?.followers_count ?? null,
					hourly_rate: creator?.hourly_rate ?? null,
				},
				conversation_id: convByApp.get(row.id) ?? null,
			}
		})
	},
)

export const getCreatorApplications = cache(
	async (creatorId: string): Promise<CreatorApplicationListItem[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase
			.from('campaign_applications')
			.select(
				`id, status, pitch, proposed_price, booking_id, created_at,
				campaign:campaigns!campaign_applications_campaign_id_fkey(
					id, slug, title, status, budget_per_creator, deadline,
					business:businesses!campaigns_business_id_fkey(company_name)
				)`,
			)
			.eq('creator_id', creatorId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('[getCreatorApplications]', error)
			return []
		}
		if (!data) return []

		return data.map((row) => {
			const campaign = row.campaign as unknown as {
				id: string
				slug: string
				title: string
				status: CampaignStatus
				budget_per_creator: number | null
				deadline: string | null
				business: { company_name: string } | null
			}
			return {
				id: row.id,
				status: row.status,
				pitch: row.pitch,
				proposed_price: row.proposed_price,
				booking_id: row.booking_id,
				created_at: row.created_at,
				campaign,
			}
		})
	},
)

export const getCampaignBookings = cache(
	async (
		campaignId: string,
	): Promise<
		{
			id: string
			title: string
			status: Database['public']['Enums']['booking_status']
			budget: number | null
			created_at: string
			creator: { display_name: string; slug: string | null }
		}[]
	> => {
		const supabase = await createClient()
		const { data, error } = await supabase
			.from('bookings')
			.select(
				`id, title, status, budget, created_at,
				creator:creators!bookings_creator_id_fkey(display_name, slug)`,
			)
			.eq('campaign_id', campaignId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('[getCampaignBookings]', error)
			return []
		}
		if (!data) return []

		return data.map((row) => {
			const creator = row.creator as unknown as {
				display_name: string
				slug: string | null
			} | null
			return {
				id: row.id,
				title: row.title,
				status: row.status,
				budget: row.budget,
				created_at: row.created_at,
				creator: {
					display_name: creator?.display_name ?? '',
					slug: creator?.slug ?? null,
				},
			}
		})
	},
)

export const getAllCampaignsForAdmin = cache(
	async (statusFilter?: CampaignStatus): Promise<CampaignListItem[]> => {
		const supabase = await createClient()
		let query = supabase
			.from('campaigns')
			.select(CAMPAIGN_SELECT)
			.order('created_at', { ascending: false })

		if (statusFilter) {
			query = query.eq('status', statusFilter)
		}

		const { data, error } = await query

		if (error) {
			console.error('[getAllCampaignsForAdmin]', error)
			return []
		}
		if (!data) return []

		return attachCounts(supabase, data as unknown as CampaignJoin[])
	},
)

export const getApplicationDetail = cache(
	async (
		applicationId: string,
	): Promise<
		| (CampaignApplicationListItem & {
				campaign: {
					id: string
					slug: string
					title: string
					status: CampaignStatus
					business_id: string
					business: { company_name: string; profile_id: string }
				}
		  })
		| null
	> => {
		const supabase = await createClient()
		const { data, error } = await supabase
			.from('campaign_applications')
			.select(
				`id, status, pitch, proposed_price, booking_id, created_at,
				creator:creators!campaign_applications_creator_id_fkey(
					id, profile_id, display_name, slug, bio, followers_count, hourly_rate,
					profile:profiles!creators_profile_id_fkey(avatar_url)
				),
				campaign:campaigns!campaign_applications_campaign_id_fkey(
					id, slug, title, status, business_id,
					business:businesses!campaigns_business_id_fkey(company_name, profile_id)
				)`,
			)
			.eq('id', applicationId)
			.single()

		if (error || !data) return null

		const creator = data.creator as unknown as {
			id: string
			profile_id: string
			display_name: string
			slug: string | null
			bio: string | null
			followers_count: number | null
			hourly_rate: number | null
			profile: { avatar_url: string | null } | null
		} | null

		const campaign = data.campaign as unknown as {
			id: string
			slug: string
			title: string
			status: CampaignStatus
			business_id: string
			business: { company_name: string; profile_id: string } | null
		}

		if (!campaign.business) return null

		const { data: conv } = await supabase
			.from('conversations')
			.select('id')
			.eq('application_id', applicationId)
			.maybeSingle()

		return {
			id: data.id,
			status: data.status,
			pitch: data.pitch,
			proposed_price: data.proposed_price,
			booking_id: data.booking_id,
			created_at: data.created_at,
			creator: {
				id: creator?.id ?? '',
				profile_id: creator?.profile_id ?? '',
				display_name: creator?.display_name ?? '',
				slug: creator?.slug ?? null,
				avatar_url: creator?.profile?.avatar_url ?? null,
				bio: creator?.bio ?? null,
				followers_count: creator?.followers_count ?? null,
				hourly_rate: creator?.hourly_rate ?? null,
			},
			conversation_id: conv?.id ?? null,
			campaign: {
				id: campaign.id,
				slug: campaign.slug,
				title: campaign.title,
				status: campaign.status,
				business_id: campaign.business_id,
				business: campaign.business,
			},
		}
	},
)
