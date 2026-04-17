'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const profileSchema = z.object({
	displayName: z.string().trim().min(1).max(100),
	bio: z.string().trim().min(1).max(500),
	specialtyIds: z.array(z.string().uuid()).min(1).max(5),
	marketIds: z.array(z.string().uuid()).min(1),
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

function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function saveCreatorProfile(
	formData: FormData,
): Promise<ActionResult<{ status: string }>> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError || !user) {
		redirect('/login')
	}

	const raw = {
		displayName: formData.get('displayName'),
		bio: formData.get('bio'),
		specialtyIds: formData.getAll('specialtyIds'),
		marketIds: formData.getAll('marketIds'),
		hourlyRate: formData.get('hourlyRate'),
		portfolioUrl: formData.get('portfolioUrl'),
		instagramHandle: formData.get('instagramHandle'),
		tiktokHandle: formData.get('tiktokHandle'),
		youtubeHandle: formData.get('youtubeHandle'),
	}

	const parsed = profileSchema.safeParse(raw)

	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue?.path[0] as string | undefined,
		}
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('id, slug')
		.eq('profile_id', user.id)
		.single()

	if (!creator) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	const avatarFile = formData.get('avatar') as File | null
	let avatarUrl: string | undefined

	if (avatarFile && avatarFile.size > 0) {
		if (avatarFile.size > MAX_AVATAR_SIZE) {
			return { success: false, error: 'errors.avatarTooLarge', field: 'avatar' }
		}
		if (!ALLOWED_AVATAR_TYPES.includes(avatarFile.type)) {
			return {
				success: false,
				error: 'errors.avatarInvalidType',
				field: 'avatar',
			}
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
			console.error('[saveCreatorProfile] avatar upload', uploadError)
			return { success: false, error: 'errors.couldNotUploadAvatarRetry' }
		}

		const { data: publicUrl } = supabase.storage
			.from('media')
			.getPublicUrl(path)
		avatarUrl = publicUrl.publicUrl
	}

	if (avatarUrl) {
		const { error: profileUpdateError } = await supabase
			.from('profiles')
			.update({ avatar_url: avatarUrl })
			.eq('id', user.id)

		if (profileUpdateError) {
			console.error('[saveCreatorProfile] profiles update', profileUpdateError)
			return { success: false, error: 'errors.couldNotUpdateAvatarRetry' }
		}
	}

	let slug = creator.slug
	if (!slug) {
		slug = generateSlug(parsed.data.displayName)
		const { data: existing } = await supabase
			.from('creators')
			.select('id')
			.eq('slug', slug)
			.neq('id', creator.id)
			.single()

		if (existing) {
			slug = `${slug}-${creator.id.slice(0, 6)}`
		}
	}

	const { error: creatorError } = await supabase
		.from('creators')
		.update({
			display_name: parsed.data.displayName,
			bio: parsed.data.bio,
			portfolio_url: parsed.data.portfolioUrl || null,
			instagram_handle: parsed.data.instagramHandle || null,
			tiktok_handle: parsed.data.tiktokHandle || null,
			youtube_handle: parsed.data.youtubeHandle || null,
			hourly_rate: parsed.data.hourlyRate || null,
			slug,
			status: 'pending_review',
		})
		.eq('id', creator.id)

	if (creatorError) {
		console.error('[saveCreatorProfile] creators update', creatorError)
		return { success: false, error: 'errors.couldNotSaveProfile' }
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
			console.error('[saveCreatorProfile] specialties insert', specError)
			return { success: false, error: 'errors.couldNotSaveSpecialties' }
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
			console.error('[saveCreatorProfile] markets insert', marketsError)
			return { success: false, error: 'errors.couldNotSaveMarkets' }
		}
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: { status: 'pending_review' } }
}
