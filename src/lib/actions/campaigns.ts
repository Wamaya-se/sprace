'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/guards'
import {
	applyCampaignSchema,
	applicationIdSchema,
	campaignIdSchema,
	createCampaignSchema,
} from '@/lib/validation/campaigns'
import {
	canApply,
	canPublish,
	canTransitionApplication,
	canTransitionCampaign,
	shouldAutoComplete,
} from '@/lib/campaigns/state-machine'
import { generateCampaignSlug } from '@/lib/campaigns/slug'
import type { ActionResult } from '@/types/actions'

function formDataToArray(formData: FormData, key: string): string[] {
	return formData
		.getAll(key)
		.map((v) => v.toString())
		.filter(Boolean)
}

// ============================================================
// CAMPAIGN LIFECYCLE
// ============================================================

export async function createCampaign(
	formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
	const { user, supabase } = await requireUser()

	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.onlyBusinessCanCreateCampaigns' }
	}

	const raw = {
		title: formData.get('title'),
		description: formData.get('description'),
		budgetPerCreator: formData.get('budgetPerCreator') || undefined,
		totalBudget: formData.get('totalBudget') || undefined,
		deadline: formData.get('deadline') || undefined,
		specialtyIds: formDataToArray(formData, 'specialtyIds'),
		marketIds: formDataToArray(formData, 'marketIds'),
	}

	const parsed = createCampaignSchema.safeParse(raw)
	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue.path[0] as string,
		}
	}

	const { data: business } = await supabase
		.from('businesses')
		.select('id')
		.eq('profile_id', user.id)
		.single()

	if (!business) {
		return { success: false, error: 'errors.businessProfileNotFound' }
	}

	// Retry slug generation a couple of times in the very unlikely case of
	// a collision on the random suffix.
	let slug = generateCampaignSlug(parsed.data.title)
	let campaign: { id: string; slug: string } | null = null
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const { data, error } = await supabase
			.from('campaigns')
			.insert({
				business_id: business.id,
				title: parsed.data.title,
				description: parsed.data.description,
				budget_per_creator: parsed.data.budgetPerCreator ?? null,
				total_budget: parsed.data.totalBudget ?? null,
				deadline: parsed.data.deadline ?? null,
				slug,
				status: 'draft',
			})
			.select('id, slug')
			.single()

		if (!error && data) {
			campaign = data
			break
		}

		if (error?.code === '23505') {
			slug = generateCampaignSlug(parsed.data.title)
			continue
		}

		console.error('[createCampaign]', error)
		return { success: false, error: 'errors.couldNotCreateCampaign' }
	}

	if (!campaign) {
		return { success: false, error: 'errors.couldNotCreateCampaign' }
	}

	if (parsed.data.specialtyIds.length > 0) {
		const { error: specError } = await supabase
			.from('campaign_specialties')
			.insert(
				parsed.data.specialtyIds.map((specialty_id) => ({
					campaign_id: campaign.id,
					specialty_id,
				})),
			)
		if (specError) {
			console.error('[createCampaign] specialties insert failed', specError)
		}
	}

	if (parsed.data.marketIds.length > 0) {
		const { error: marketError } = await supabase
			.from('campaign_markets')
			.insert(
				parsed.data.marketIds.map((market_id) => ({
					campaign_id: campaign.id,
					market_id,
				})),
			)
		if (marketError) {
			console.error('[createCampaign] markets insert failed', marketError)
		}
	}

	revalidatePath('/dashboard/campaigns')
	return { success: true, data: campaign }
}

export async function updateCampaign(
	campaignId: string,
	formData: FormData,
): Promise<ActionResult> {
	const parsedId = campaignIdSchema.safeParse(campaignId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidCampaignId' }
	}

	const { user, supabase } = await requireUser()
	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: campaign } = await supabase
		.from('campaigns')
		.select(
			`id, status,
			business:businesses!campaigns_business_id_fkey(profile_id)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!campaign) {
		return { success: false, error: 'errors.campaignNotFound' }
	}

	const business = campaign.business as unknown as { profile_id: string } | null
	if (business?.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	if (campaign.status !== 'draft' && campaign.status !== 'open') {
		return { success: false, error: 'errors.campaignReadOnly' }
	}

	const raw = {
		title: formData.get('title'),
		description: formData.get('description'),
		budgetPerCreator: formData.get('budgetPerCreator') || undefined,
		totalBudget: formData.get('totalBudget') || undefined,
		deadline: formData.get('deadline') || undefined,
		specialtyIds: formDataToArray(formData, 'specialtyIds'),
		marketIds: formDataToArray(formData, 'marketIds'),
	}

	const parsed = createCampaignSchema.safeParse(raw)
	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue.path[0] as string,
		}
	}

	const { error: updateError } = await supabase
		.from('campaigns')
		.update({
			title: parsed.data.title,
			description: parsed.data.description,
			budget_per_creator: parsed.data.budgetPerCreator ?? null,
			total_budget: parsed.data.totalBudget ?? null,
			deadline: parsed.data.deadline ?? null,
		})
		.eq('id', parsedId.data)

	if (updateError) {
		console.error('[updateCampaign]', updateError)
		return { success: false, error: 'errors.couldNotUpdateCampaign' }
	}

	// Reset junctions — drafts can change their targeting freely; for open
	// campaigns we also allow updating targeting to keep things simple.
	await supabase
		.from('campaign_specialties')
		.delete()
		.eq('campaign_id', parsedId.data)
	if (parsed.data.specialtyIds.length > 0) {
		await supabase.from('campaign_specialties').insert(
			parsed.data.specialtyIds.map((specialty_id) => ({
				campaign_id: parsedId.data,
				specialty_id,
			})),
		)
	}

	await supabase
		.from('campaign_markets')
		.delete()
		.eq('campaign_id', parsedId.data)
	if (parsed.data.marketIds.length > 0) {
		await supabase.from('campaign_markets').insert(
			parsed.data.marketIds.map((market_id) => ({
				campaign_id: parsedId.data,
				market_id,
			})),
		)
	}

	revalidatePath('/dashboard/campaigns')
	revalidatePath(`/dashboard/campaigns/${parsedId.data}`)
	return { success: true, data: undefined }
}

export async function publishCampaign(
	campaignId: string,
): Promise<ActionResult> {
	const parsedId = campaignIdSchema.safeParse(campaignId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidCampaignId' }
	}

	const { user, supabase } = await requireUser()
	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: campaign } = await supabase
		.from('campaigns')
		.select(
			`id, status, slug,
			business:businesses!campaigns_business_id_fkey(profile_id)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!campaign) {
		return { success: false, error: 'errors.campaignNotFound' }
	}

	const business = campaign.business as unknown as { profile_id: string } | null
	if (business?.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	if (!canPublish(campaign.status)) {
		return { success: false, error: 'errors.campaignNotDraft' }
	}

	const transition = canTransitionCampaign(campaign.status, 'open')
	if (!transition.ok) {
		return { success: false, error: 'errors.invalidStatusTransition' }
	}

	const { error } = await supabase
		.from('campaigns')
		.update({
			status: 'open',
			published_at: new Date().toISOString(),
		})
		.eq('id', parsedId.data)

	if (error) {
		console.error('[publishCampaign]', error)
		return { success: false, error: 'errors.couldNotUpdateCampaign' }
	}

	revalidatePath('/dashboard/campaigns')
	revalidatePath(`/dashboard/campaigns/${parsedId.data}`)
	revalidatePath('/campaigns')
	revalidatePath(`/campaigns/${campaign.slug}`)
	return { success: true, data: undefined }
}

async function notifyPendingApplicants(
	supabase: Awaited<ReturnType<typeof createClient>>,
	campaignId: string,
	campaignTitle: string,
) {
	const { data: applications } = await supabase
		.from('campaign_applications')
		.select(
			`id, status,
			creator:creators!campaign_applications_creator_id_fkey(profile_id)`,
		)
		.eq('campaign_id', campaignId)
		.in('status', ['pending', 'shortlisted'])

	if (!applications || applications.length === 0) {
		return
	}

	const nt = await getTranslations('notifications')
	const { createNotification } = await import('@/lib/notifications')

	await Promise.all(
		applications.map((app) => {
			const creator = app.creator as unknown as { profile_id: string } | null
			if (!creator?.profile_id) return null
			return createNotification({
				userId: creator.profile_id,
				type: 'campaign_closed',
				title: nt('campaignClosed'),
				body: nt('campaignClosedBody', { title: campaignTitle }),
				link: '/dashboard/campaigns/applications',
			}).catch((err) => console.error('[notifyPendingApplicants]', err))
		}),
	)
}

export async function closeCampaign(campaignId: string): Promise<ActionResult> {
	const parsedId = campaignIdSchema.safeParse(campaignId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidCampaignId' }
	}

	const { user, supabase } = await requireUser()
	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: campaign } = await supabase
		.from('campaigns')
		.select(
			`id, status, title, slug,
			business:businesses!campaigns_business_id_fkey(profile_id)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!campaign) {
		return { success: false, error: 'errors.campaignNotFound' }
	}

	const business = campaign.business as unknown as { profile_id: string } | null
	if (business?.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const transition = canTransitionCampaign(campaign.status, 'closed')
	if (!transition.ok) {
		return { success: false, error: 'errors.invalidStatusTransition' }
	}

	const { error } = await supabase
		.from('campaigns')
		.update({ status: 'closed', closed_at: new Date().toISOString() })
		.eq('id', parsedId.data)

	if (error) {
		console.error('[closeCampaign]', error)
		return { success: false, error: 'errors.couldNotUpdateCampaign' }
	}

	await notifyPendingApplicants(supabase, parsedId.data, campaign.title)

	revalidatePath('/dashboard/campaigns')
	revalidatePath(`/dashboard/campaigns/${parsedId.data}`)
	revalidatePath('/campaigns')
	revalidatePath(`/campaigns/${campaign.slug}`)
	return { success: true, data: undefined }
}

export async function cancelCampaign(
	campaignId: string,
): Promise<ActionResult> {
	const parsedId = campaignIdSchema.safeParse(campaignId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidCampaignId' }
	}

	const { user, supabase } = await requireUser()
	const isAdminUser = user.app_metadata?.role === 'admin'

	const { data: campaign } = await supabase
		.from('campaigns')
		.select(
			`id, status, title, slug,
			business:businesses!campaigns_business_id_fkey(profile_id)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!campaign) {
		return { success: false, error: 'errors.campaignNotFound' }
	}

	const business = campaign.business as unknown as { profile_id: string } | null
	if (!isAdminUser && business?.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const transition = canTransitionCampaign(campaign.status, 'cancelled')
	if (!transition.ok) {
		return { success: false, error: 'errors.invalidStatusTransition' }
	}

	const { error } = await supabase
		.from('campaigns')
		.update({ status: 'cancelled', closed_at: new Date().toISOString() })
		.eq('id', parsedId.data)

	if (error) {
		console.error('[cancelCampaign]', error)
		return { success: false, error: 'errors.couldNotUpdateCampaign' }
	}

	await notifyPendingApplicants(supabase, parsedId.data, campaign.title)

	revalidatePath('/dashboard/campaigns')
	revalidatePath(`/dashboard/campaigns/${parsedId.data}`)
	revalidatePath('/campaigns')
	revalidatePath(`/campaigns/${campaign.slug}`)
	revalidatePath('/admin/campaigns')
	return { success: true, data: undefined }
}

/**
 * Internal helper called from booking status transitions. Marks a
 * campaign as `completed` when all its non-cancelled bookings are
 * completed.
 */
export async function completeCampaignIfDone(
	campaignId: string,
): Promise<void> {
	const supabase = await createClient()

	const { data: campaign } = await supabase
		.from('campaigns')
		.select('id, status, slug')
		.eq('id', campaignId)
		.single()

	if (!campaign) return
	if (campaign.status !== 'closed' && campaign.status !== 'open') return

	const { data: bookings } = await supabase
		.from('bookings')
		.select('status')
		.eq('campaign_id', campaignId)

	if (!bookings) return

	if (!shouldAutoComplete(bookings.map((b) => b.status))) {
		return
	}

	const { error } = await supabase
		.from('campaigns')
		.update({ status: 'completed', closed_at: new Date().toISOString() })
		.eq('id', campaignId)
		.in('status', ['open', 'closed'])

	if (error) {
		console.error('[completeCampaignIfDone]', error)
		return
	}

	revalidatePath('/dashboard/campaigns')
	revalidatePath(`/dashboard/campaigns/${campaignId}`)
	revalidatePath('/campaigns')
	revalidatePath(`/campaigns/${campaign.slug}`)
}

// ============================================================
// APPLICATIONS
// ============================================================

export async function applyCampaign(
	formData: FormData,
): Promise<ActionResult<{ id: string }>> {
	const { user, supabase } = await requireUser()

	if (user.app_metadata?.role !== 'creator') {
		return { success: false, error: 'errors.onlyCreatorCanApply' }
	}

	const raw = {
		campaignId: formData.get('campaignId'),
		pitch: formData.get('pitch'),
		proposedPrice: formData.get('proposedPrice') || undefined,
	}

	const parsed = applyCampaignSchema.safeParse(raw)
	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue.path[0] as string,
		}
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('id, status')
		.eq('profile_id', user.id)
		.single()

	if (!creator) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}
	if (creator.status !== 'active') {
		return { success: false, error: 'errors.creatorProfileInactive' }
	}

	const { data: campaign } = await supabase
		.from('campaigns')
		.select(
			`id, status, title,
			business:businesses!campaigns_business_id_fkey(profile_id)`,
		)
		.eq('id', parsed.data.campaignId)
		.single()

	if (!campaign) {
		return { success: false, error: 'errors.campaignNotFound' }
	}

	const { data: existingApp } = await supabase
		.from('campaign_applications')
		.select('id, status')
		.eq('campaign_id', parsed.data.campaignId)
		.eq('creator_id', creator.id)
		.maybeSingle()

	if (!canApply(campaign.status, existingApp?.status ?? null)) {
		return { success: false, error: 'errors.cannotApplyToCampaign' }
	}

	let application: { id: string } | null = null

	if (existingApp) {
		const { data, error } = await supabase
			.from('campaign_applications')
			.update({
				pitch: parsed.data.pitch,
				proposed_price: parsed.data.proposedPrice ?? null,
				status: 'pending',
				booking_id: null,
			})
			.eq('id', existingApp.id)
			.select('id')
			.single()
		if (error || !data) {
			console.error('[applyCampaign] update', error)
			return { success: false, error: 'errors.couldNotApply' }
		}
		application = data
	} else {
		const { data, error } = await supabase
			.from('campaign_applications')
			.insert({
				campaign_id: parsed.data.campaignId,
				creator_id: creator.id,
				pitch: parsed.data.pitch,
				proposed_price: parsed.data.proposedPrice ?? null,
				status: 'pending',
			})
			.select('id')
			.single()
		if (error || !data) {
			if (error?.code === '23505') {
				return { success: false, error: 'errors.alreadyApplied' }
			}
			console.error('[applyCampaign] insert', error)
			return { success: false, error: 'errors.couldNotApply' }
		}
		application = data
	}

	const business = campaign.business as unknown as { profile_id: string } | null
	if (business?.profile_id) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await createNotification({
			userId: business.profile_id,
			type: 'campaign_new_application',
			title: nt('campaignNewApplication'),
			body: nt('campaignNewApplicationBody', { title: campaign.title }),
			link: `/dashboard/campaigns/${campaign.id}`,
		}).catch((err) => console.error('[applyCampaign] notification failed', err))
	}

	revalidatePath(`/dashboard/campaigns/${campaign.id}`)
	revalidatePath('/dashboard/campaigns/applications')
	return { success: true, data: application }
}

export async function withdrawApplication(
	applicationId: string,
): Promise<ActionResult> {
	const parsedId = applicationIdSchema.safeParse(applicationId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidApplicationId' }
	}

	const { user, supabase } = await requireUser()
	if (user.app_metadata?.role !== 'creator') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: application } = await supabase
		.from('campaign_applications')
		.select(
			`id, status, campaign_id,
			creator:creators!campaign_applications_creator_id_fkey(profile_id)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!application) {
		return { success: false, error: 'errors.applicationNotFound' }
	}

	const creator = application.creator as unknown as {
		profile_id: string
	} | null
	if (creator?.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const transition = canTransitionApplication(
		application.status,
		'withdrawn',
		'creator',
	)
	if (!transition.ok) {
		return { success: false, error: 'errors.invalidStatusTransition' }
	}

	const { error } = await supabase
		.from('campaign_applications')
		.update({ status: 'withdrawn' })
		.eq('id', parsedId.data)

	if (error) {
		console.error('[withdrawApplication]', error)
		return { success: false, error: 'errors.couldNotUpdateApplication' }
	}

	revalidatePath(`/dashboard/campaigns/${application.campaign_id}`)
	revalidatePath('/dashboard/campaigns/applications')
	return { success: true, data: undefined }
}

async function businessOwnsCampaign(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
	campaignId: string,
): Promise<boolean> {
	const { data } = await supabase
		.from('campaigns')
		.select('id, business:businesses!campaigns_business_id_fkey(profile_id)')
		.eq('id', campaignId)
		.single()
	if (!data) return false
	const business = data.business as unknown as { profile_id: string } | null
	return business?.profile_id === userId
}

export async function shortlistApplication(
	applicationId: string,
): Promise<ActionResult> {
	const parsedId = applicationIdSchema.safeParse(applicationId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidApplicationId' }
	}

	const { user, supabase } = await requireUser()
	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: application } = await supabase
		.from('campaign_applications')
		.select(
			`id, status, campaign_id,
			creator:creators!campaign_applications_creator_id_fkey(profile_id),
			campaign:campaigns!campaign_applications_campaign_id_fkey(title)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!application) {
		return { success: false, error: 'errors.applicationNotFound' }
	}

	const owns = await businessOwnsCampaign(
		supabase,
		user.id,
		application.campaign_id,
	)
	if (!owns) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const transition = canTransitionApplication(
		application.status,
		'shortlisted',
		'business',
	)
	if (!transition.ok) {
		return { success: false, error: 'errors.invalidStatusTransition' }
	}

	const { error } = await supabase
		.from('campaign_applications')
		.update({ status: 'shortlisted' })
		.eq('id', parsedId.data)

	if (error) {
		console.error('[shortlistApplication]', error)
		return { success: false, error: 'errors.couldNotUpdateApplication' }
	}

	const creator = application.creator as unknown as {
		profile_id: string
	} | null
	const campaign = application.campaign as unknown as { title: string } | null

	if (creator?.profile_id && campaign?.title) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await createNotification({
			userId: creator.profile_id,
			type: 'campaign_application_shortlisted',
			title: nt('campaignApplicationShortlisted'),
			body: nt('campaignApplicationShortlistedBody', {
				title: campaign.title,
			}),
			link: '/dashboard/campaigns/applications',
		}).catch((err) =>
			console.error('[shortlistApplication] notification failed', err),
		)
	}

	revalidatePath(`/dashboard/campaigns/${application.campaign_id}`)
	return { success: true, data: undefined }
}

export async function declineApplication(
	applicationId: string,
): Promise<ActionResult> {
	const parsedId = applicationIdSchema.safeParse(applicationId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidApplicationId' }
	}

	const { user, supabase } = await requireUser()
	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: application } = await supabase
		.from('campaign_applications')
		.select(
			`id, status, campaign_id,
			creator:creators!campaign_applications_creator_id_fkey(profile_id),
			campaign:campaigns!campaign_applications_campaign_id_fkey(title)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!application) {
		return { success: false, error: 'errors.applicationNotFound' }
	}

	const owns = await businessOwnsCampaign(
		supabase,
		user.id,
		application.campaign_id,
	)
	if (!owns) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const transition = canTransitionApplication(
		application.status,
		'declined',
		'business',
	)
	if (!transition.ok) {
		return { success: false, error: 'errors.invalidStatusTransition' }
	}

	const { error } = await supabase
		.from('campaign_applications')
		.update({ status: 'declined' })
		.eq('id', parsedId.data)

	if (error) {
		console.error('[declineApplication]', error)
		return { success: false, error: 'errors.couldNotUpdateApplication' }
	}

	const creator = application.creator as unknown as {
		profile_id: string
	} | null
	const campaign = application.campaign as unknown as { title: string } | null

	if (creator?.profile_id && campaign?.title) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await createNotification({
			userId: creator.profile_id,
			type: 'campaign_application_declined',
			title: nt('campaignApplicationDeclined'),
			body: nt('campaignApplicationDeclinedBody', {
				title: campaign.title,
			}),
			link: '/dashboard/campaigns/applications',
		}).catch((err) =>
			console.error('[declineApplication] notification failed', err),
		)
	}

	revalidatePath(`/dashboard/campaigns/${application.campaign_id}`)
	return { success: true, data: undefined }
}

export async function acceptApplication(
	applicationId: string,
): Promise<ActionResult<{ bookingId: string }>> {
	const parsedId = applicationIdSchema.safeParse(applicationId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidApplicationId' }
	}

	const { user, supabase } = await requireUser()
	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: application } = await supabase
		.from('campaign_applications')
		.select(
			`id, status, campaign_id, creator_id, pitch, proposed_price,
			creator:creators!campaign_applications_creator_id_fkey(id, profile_id),
			campaign:campaigns!campaign_applications_campaign_id_fkey(
				id, title, description, deadline, budget_per_creator, business_id,
				business:businesses!campaigns_business_id_fkey(id, profile_id)
			)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!application) {
		return { success: false, error: 'errors.applicationNotFound' }
	}

	const campaign = application.campaign as unknown as {
		id: string
		title: string
		description: string
		deadline: string | null
		budget_per_creator: number | null
		business_id: string
		business: { id: string; profile_id: string } | null
	} | null
	const creator = application.creator as unknown as {
		id: string
		profile_id: string
	} | null

	if (!campaign?.business || campaign.business.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}
	if (!creator) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	const transition = canTransitionApplication(
		application.status,
		'accepted',
		'business',
	)
	if (!transition.ok) {
		return { success: false, error: 'errors.invalidStatusTransition' }
	}

	const description = `${campaign.description}\n\n---\n${application.pitch}`
	const budget = application.proposed_price ?? campaign.budget_per_creator

	const { data: booking, error: bookingError } = await supabase
		.from('bookings')
		.insert({
			business_id: campaign.business.id,
			creator_id: creator.id,
			campaign_id: campaign.id,
			title: campaign.title,
			description,
			budget: budget ?? null,
			deadline: campaign.deadline,
			status: 'awaiting_payment',
		})
		.select('id')
		.single()

	if (bookingError || !booking) {
		console.error('[acceptApplication] booking insert', bookingError)
		return { success: false, error: 'errors.couldNotCreateBooking' }
	}

	const { error: appUpdateError } = await supabase
		.from('campaign_applications')
		.update({ status: 'accepted', booking_id: booking.id })
		.eq('id', parsedId.data)

	if (appUpdateError) {
		console.error(
			'[acceptApplication] application update failed',
			appUpdateError,
		)
	}

	// Migrate an existing application conversation into the booking, so
	// message history is preserved. If none exists, create a fresh
	// booking-scoped conversation in the same shape as createBooking.
	const { data: appConversation } = await supabase
		.from('conversations')
		.select('id')
		.eq('application_id', parsedId.data)
		.maybeSingle()

	let conversationId: string | null = null
	if (appConversation) {
		const { error: convUpdateError } = await supabase
			.from('conversations')
			.update({
				booking_id: booking.id,
				application_id: null,
				last_message_at: new Date().toISOString(),
			})
			.eq('id', appConversation.id)
		if (convUpdateError) {
			console.error('[acceptApplication] migrate conv', convUpdateError)
		} else {
			conversationId = appConversation.id
		}
	}

	if (!conversationId) {
		const { data: newConv, error: convError } = await supabase
			.from('conversations')
			.insert({
				booking_id: booking.id,
				participant_one: user.id,
				participant_two: creator.profile_id,
			})
			.select('id')
			.single()
		if (convError) {
			console.error(
				'[acceptApplication] conversation creation failed',
				convError,
			)
		} else if (newConv) {
			conversationId = newConv.id
		}
	}

	if (conversationId) {
		const t = await getTranslations('bookings')
		await supabase.from('messages').insert({
			conversation_id: conversationId,
			sender_id: user.id,
			content: t('systemCampaignBookingCreated', { title: campaign.title }),
			is_system: true,
		})
	}

	const nt = await getTranslations('notifications')
	const { createNotification } = await import('@/lib/notifications')
	await createNotification({
		userId: creator.profile_id,
		type: 'campaign_application_accepted',
		title: nt('campaignApplicationAccepted'),
		body: nt('campaignApplicationAcceptedBody', { title: campaign.title }),
		link: `/dashboard/bookings/${booking.id}`,
	}).catch((err) =>
		console.error('[acceptApplication] notification failed', err),
	)

	revalidatePath(`/dashboard/campaigns/${campaign.id}`)
	revalidatePath('/dashboard/campaigns/applications')
	revalidatePath(`/dashboard/bookings/${booking.id}`)
	revalidatePath('/dashboard/bookings')
	return { success: true, data: { bookingId: booking.id } }
}

// ============================================================
// APPLICATION CONVERSATION (pre-booking chat)
// ============================================================

export async function startApplicationConversation(
	applicationId: string,
): Promise<ActionResult<{ conversationId: string }>> {
	const parsedId = applicationIdSchema.safeParse(applicationId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidApplicationId' }
	}

	const { user, supabase } = await requireUser()
	const role = user.app_metadata?.role as string
	if (role !== 'business' && role !== 'creator') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: application } = await supabase
		.from('campaign_applications')
		.select(
			`id, status, campaign_id,
			creator:creators!campaign_applications_creator_id_fkey(profile_id),
			campaign:campaigns!campaign_applications_campaign_id_fkey(
				business:businesses!campaigns_business_id_fkey(profile_id)
			)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!application) {
		return { success: false, error: 'errors.applicationNotFound' }
	}

	const creator = application.creator as unknown as {
		profile_id: string
	} | null
	const campaign = application.campaign as unknown as {
		business: { profile_id: string } | null
	} | null

	const businessProfileId = campaign?.business?.profile_id ?? null
	const creatorProfileId = creator?.profile_id ?? null

	if (!businessProfileId || !creatorProfileId) {
		return { success: false, error: 'errors.applicationNotFound' }
	}

	const isParticipant =
		(role === 'business' && businessProfileId === user.id) ||
		(role === 'creator' && creatorProfileId === user.id)

	if (!isParticipant) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	if (['accepted', 'withdrawn', 'declined'].includes(application.status)) {
		return { success: false, error: 'errors.applicationInactive' }
	}

	const { data: existing } = await supabase
		.from('conversations')
		.select('id')
		.eq('application_id', parsedId.data)
		.maybeSingle()

	if (existing) {
		return { success: true, data: { conversationId: existing.id } }
	}

	const { data: conversation, error } = await supabase
		.from('conversations')
		.insert({
			application_id: parsedId.data,
			participant_one: businessProfileId,
			participant_two: creatorProfileId,
		})
		.select('id')
		.single()

	if (error || !conversation) {
		if (error?.code === '23505') {
			const { data: retry } = await supabase
				.from('conversations')
				.select('id')
				.eq('application_id', parsedId.data)
				.maybeSingle()
			if (retry) {
				return { success: true, data: { conversationId: retry.id } }
			}
		}
		console.error('[startApplicationConversation]', error)
		return { success: false, error: 'errors.couldNotStartConversation' }
	}

	revalidatePath('/dashboard/messages')
	return { success: true, data: { conversationId: conversation.id } }
}

export type {
	CampaignListItem,
	CampaignDetail,
	CampaignApplicationListItem,
	CreatorApplicationListItem,
	PublicCampaignListItem,
} from '@/lib/queries/campaigns'
