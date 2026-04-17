'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

async function requireCreator() {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()
	if (error || !user) {
		redirect('/login')
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('id, slug')
		.eq('profile_id', user.id)
		.single()

	if (!creator) {
		redirect('/dashboard')
	}

	return { user, supabase, creator }
}

// --- About (display name + bio) ---

const aboutSchema = z.object({
	displayName: z.string().trim().min(1).max(100),
	bio: z.string().trim().min(1).max(500),
})

export async function updateCreatorAbout(
	displayName: string,
	bio: string,
): Promise<ActionResult> {
	const { supabase, creator } = await requireCreator()

	const parsed = aboutSchema.safeParse({ displayName, bio })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const { error } = await supabase
		.from('creators')
		.update({
			display_name: parsed.data.displayName,
			bio: parsed.data.bio,
		})
		.eq('id', creator.id)

	if (error) {
		console.error('[updateCreatorAbout]', error)
		return { success: false, error: 'errors.couldNotUpdateProfile' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}

// --- Specialties & Markets ---

const specialtiesMarketsSchema = z.object({
	specialtyIds: z.array(z.string().uuid()).min(1).max(5),
	marketIds: z.array(z.string().uuid()).min(1),
})

export async function updateCreatorSpecialtiesMarkets(
	specialtyIds: string[],
	marketIds: string[],
): Promise<ActionResult> {
	const { supabase, creator } = await requireCreator()

	const parsed = specialtiesMarketsSchema.safeParse({ specialtyIds, marketIds })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	await supabase
		.from('creator_specialties')
		.delete()
		.eq('creator_id', creator.id)

	if (parsed.data.specialtyIds.length > 0) {
		const { error: specError } = await supabase
			.from('creator_specialties')
			.insert(
				parsed.data.specialtyIds.map((sid) => ({
					creator_id: creator.id,
					specialty_id: sid,
				})),
			)

		if (specError) {
			console.error('[updateCreatorSpecialtiesMarkets] specialties', specError)
			return { success: false, error: 'errors.couldNotUpdateSpecialties' }
		}
	}

	await supabase.from('creator_markets').delete().eq('creator_id', creator.id)

	if (parsed.data.marketIds.length > 0) {
		const { error: marketsError } = await supabase
			.from('creator_markets')
			.insert(
				parsed.data.marketIds.map((mid) => ({
					creator_id: creator.id,
					market_id: mid,
				})),
			)

		if (marketsError) {
			console.error('[updateCreatorSpecialtiesMarkets] markets', marketsError)
			return { success: false, error: 'errors.couldNotUpdateMarkets' }
		}
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}

// --- Rates & Links ---

const linksSchema = z.object({
	hourlyRate: z.preprocess(
		(v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
		z.number().positive().max(100000).optional(),
	),
	portfolioUrl: z.preprocess(
		(v) => (v === '' ? undefined : v),
		z.string().url().max(500).optional(),
	),
	instagramHandle: z.preprocess(
		(v) => (v === '' ? undefined : String(v).replace(/^@/, '')),
		z.string().max(50).optional(),
	),
	tiktokHandle: z.preprocess(
		(v) => (v === '' ? undefined : String(v).replace(/^@/, '')),
		z.string().max(50).optional(),
	),
	youtubeHandle: z.preprocess(
		(v) => (v === '' ? undefined : String(v).replace(/^@/, '')),
		z.string().max(100).optional(),
	),
})

export async function updateCreatorLinks(data: {
	hourlyRate: string
	portfolioUrl: string
	instagramHandle: string
	tiktokHandle: string
	youtubeHandle: string
}): Promise<ActionResult> {
	const { supabase, creator } = await requireCreator()

	const parsed = linksSchema.safeParse(data)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const { error } = await supabase
		.from('creators')
		.update({
			hourly_rate: parsed.data.hourlyRate || null,
			portfolio_url: parsed.data.portfolioUrl || null,
			instagram_handle: parsed.data.instagramHandle || null,
			tiktok_handle: parsed.data.tiktokHandle || null,
			youtube_handle: parsed.data.youtubeHandle || null,
		})
		.eq('id', creator.id)

	if (error) {
		console.error('[updateCreatorLinks]', error)
		return { success: false, error: 'errors.couldNotUpdateLinks' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}

// --- Avatar ---

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function updateCreatorAvatar(
	formData: FormData,
): Promise<ActionResult> {
	const { user, supabase } = await requireCreator()

	const avatarFile = formData.get('avatar') as File | null
	if (!avatarFile || avatarFile.size === 0) {
		return { success: false, error: 'errors.noFileProvided' }
	}

	if (avatarFile.size > MAX_AVATAR_SIZE) {
		return { success: false, error: 'errors.avatarTooLarge' }
	}

	if (!ALLOWED_AVATAR_TYPES.includes(avatarFile.type)) {
		return { success: false, error: 'errors.avatarInvalidType' }
	}

	const ext =
		avatarFile.type.split('/')[1] === 'jpeg'
			? 'jpg'
			: avatarFile.type.split('/')[1]
	const path = `${user.id}/avatar.${ext}`

	const { error: uploadError } = await supabase.storage
		.from('media')
		.upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })

	if (uploadError) {
		console.error('[updateCreatorAvatar] upload', uploadError)
		return { success: false, error: 'errors.couldNotUploadAvatar' }
	}

	const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path)

	const { error: updateError } = await supabase
		.from('profiles')
		.update({ avatar_url: publicUrl.publicUrl })
		.eq('id', user.id)

	if (updateError) {
		console.error('[updateCreatorAvatar] profiles update', updateError)
		return { success: false, error: 'errors.couldNotUpdateAvatar' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}
