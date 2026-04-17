'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const serviceSchema = z.object({
	name: z.string().trim().min(1).max(100),
	description: z.preprocess(
		(v) => (v === '' ? undefined : v),
		z.string().trim().max(2000).optional(),
	),
	price: z.coerce.number().positive().max(1_000_000),
	deliveryDays: z.coerce.number().int().positive().max(365),
	isActive: z.preprocess((v) => v === 'true' || v === true, z.boolean()),
})

const MAX_MEDIA_SIZE = 10 * 1024 * 1024
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MEDIA_COUNT = 4

async function getCreatorId(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
) {
	const { data: creator } = await supabase
		.from('creators')
		.select('id')
		.eq('profile_id', userId)
		.single()
	return creator?.id ?? null
}

function validateMediaFiles(files: File[]): string | null {
	if (files.length > MAX_MEDIA_COUNT) {
		return 'errors.maxImagesPerService'
	}
	for (const file of files) {
		if (file.size > MAX_MEDIA_SIZE) {
			return 'errors.imageTooLarge'
		}
		if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
			return 'errors.imageInvalidType'
		}
	}
	return null
}

function getFileExtension(mimeType: string): string {
	return mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1]
}

export async function createService(
	formData: FormData,
): Promise<ActionResult<{ id: string }>> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError || !user) {
		redirect('/login')
	}

	const creatorId = await getCreatorId(supabase, user.id)
	if (!creatorId) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	const raw = {
		name: formData.get('name'),
		description: formData.get('description'),
		price: formData.get('price'),
		deliveryDays: formData.get('deliveryDays'),
		isActive: formData.get('isActive'),
	}

	const parsed = serviceSchema.safeParse(raw)
	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue?.path[0] as string | undefined,
		}
	}

	const mediaFiles = formData
		.getAll('media')
		.filter((f): f is File => f instanceof File && f.size > 0)

	const mediaError = validateMediaFiles(mediaFiles)
	if (mediaError) {
		return { success: false, error: mediaError, field: 'media' }
	}

	const { data: maxOrder } = await supabase
		.from('services')
		.select('sort_order')
		.eq('creator_id', creatorId)
		.order('sort_order', { ascending: false })
		.limit(1)
		.single()

	const nextOrder = (maxOrder?.sort_order ?? -1) + 1

	const { data: service, error: insertError } = await supabase
		.from('services')
		.insert({
			creator_id: creatorId,
			name: parsed.data.name,
			description: parsed.data.description || null,
			price: parsed.data.price,
			delivery_days: parsed.data.deliveryDays,
			is_active: parsed.data.isActive,
			sort_order: nextOrder,
		})
		.select('id')
		.single()

	if (insertError || !service) {
		console.error('[createService] insert', insertError)
		return { success: false, error: 'errors.couldNotCreateService' }
	}

	if (mediaFiles.length > 0) {
		const mediaInserts = []
		for (let i = 0; i < mediaFiles.length; i++) {
			const file = mediaFiles[i]
			const ext = getFileExtension(file.type)
			const path = `${user.id}/services/${service.id}/${i}.${ext}`

			const { error: uploadError } = await supabase.storage
				.from('media')
				.upload(path, file, { upsert: true, contentType: file.type })

			if (uploadError) {
				console.error('[createService] media upload', uploadError)
				return { success: false, error: 'errors.couldNotUploadImages' }
			}

			const { data: publicUrl } = supabase.storage
				.from('media')
				.getPublicUrl(path)
			mediaInserts.push({
				service_id: service.id,
				media_url: publicUrl.publicUrl,
				media_type: 'image' as const,
				sort_order: i,
			})
		}

		const { error: mediaInsertError } = await supabase
			.from('service_media')
			.insert(mediaInserts)

		if (mediaInsertError) {
			console.error('[createService] media insert', mediaInsertError)
			return { success: false, error: 'errors.couldNotSaveImageMetadata' }
		}
	}

	revalidatePath('/dashboard/services')
	return { success: true, data: { id: service.id } }
}

export async function updateService(
	formData: FormData,
): Promise<ActionResult<{ id: string }>> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError || !user) {
		redirect('/login')
	}

	const rawServiceId = formData.get('serviceId')
	const serviceIdResult = z.string().uuid().safeParse(rawServiceId)
	if (!serviceIdResult.success) {
		return { success: false, error: 'errors.invalidServiceId' }
	}
	const serviceId = serviceIdResult.data

	const creatorId = await getCreatorId(supabase, user.id)
	if (!creatorId) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	const { data: existing } = await supabase
		.from('services')
		.select('id, creator_id')
		.eq('id', serviceId)
		.eq('creator_id', creatorId)
		.single()

	if (!existing) {
		return { success: false, error: 'errors.serviceNotFound' }
	}

	const raw = {
		name: formData.get('name'),
		description: formData.get('description'),
		price: formData.get('price'),
		deliveryDays: formData.get('deliveryDays'),
		isActive: formData.get('isActive'),
	}

	const parsed = serviceSchema.safeParse(raw)
	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue?.path[0] as string | undefined,
		}
	}

	const { error: updateError } = await supabase
		.from('services')
		.update({
			name: parsed.data.name,
			description: parsed.data.description || null,
			price: parsed.data.price,
			delivery_days: parsed.data.deliveryDays,
			is_active: parsed.data.isActive,
		})
		.eq('id', serviceId)

	if (updateError) {
		console.error('[updateService] update', updateError)
		return { success: false, error: 'errors.couldNotUpdateService' }
	}

	const newMediaFiles = formData
		.getAll('media')
		.filter((f): f is File => f instanceof File && f.size > 0)

	const rawKeepMediaIds = formData.getAll('keepMediaIds')
	const keepMediaIdsResult = z
		.array(z.string().uuid())
		.max(MAX_MEDIA_COUNT)
		.safeParse(rawKeepMediaIds)
	const keepMediaIds = keepMediaIdsResult.success ? keepMediaIdsResult.data : []

	const { data: currentMedia } = await supabase
		.from('service_media')
		.select('id, media_url')
		.eq('service_id', serviceId)

	const toRemove = (currentMedia ?? []).filter(
		(m) => !keepMediaIds.includes(m.id),
	)

	for (const media of toRemove) {
		const urlPath = media.media_url.split('/media/')[1]
		if (urlPath) {
			await supabase.storage.from('media').remove([urlPath])
		}
	}

	if (toRemove.length > 0) {
		await supabase
			.from('service_media')
			.delete()
			.in(
				'id',
				toRemove.map((m) => m.id),
			)
	}

	const totalAfterKeep = keepMediaIds.length
	const totalMedia = totalAfterKeep + newMediaFiles.length
	if (totalMedia > MAX_MEDIA_COUNT) {
		return {
			success: false,
			error: 'errors.maxImagesPerService',
			field: 'media',
		}
	}

	const mediaError = validateMediaFiles(newMediaFiles)
	if (mediaError) {
		return { success: false, error: mediaError, field: 'media' }
	}

	if (newMediaFiles.length > 0) {
		const mediaInserts = []
		for (let i = 0; i < newMediaFiles.length; i++) {
			const file = newMediaFiles[i]
			const ext = getFileExtension(file.type)
			const path = `${user.id}/services/${serviceId}/${totalAfterKeep + i}.${ext}`

			const { error: uploadError } = await supabase.storage
				.from('media')
				.upload(path, file, { upsert: true, contentType: file.type })

			if (uploadError) {
				console.error('[updateService] media upload', uploadError)
				return { success: false, error: 'errors.couldNotUploadImages' }
			}

			const { data: publicUrl } = supabase.storage
				.from('media')
				.getPublicUrl(path)
			mediaInserts.push({
				service_id: serviceId,
				media_url: publicUrl.publicUrl,
				media_type: 'image' as const,
				sort_order: totalAfterKeep + i,
			})
		}

		const { error: mediaInsertError } = await supabase
			.from('service_media')
			.insert(mediaInserts)

		if (mediaInsertError) {
			console.error('[updateService] media insert', mediaInsertError)
			return { success: false, error: 'errors.couldNotSaveImageMetadata' }
		}
	}

	revalidatePath('/dashboard/services')
	revalidatePath(`/dashboard/services/${serviceId}/edit`)
	return { success: true, data: { id: serviceId } }
}

export async function toggleServiceActive(
	serviceId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
	if (!z.string().uuid().safeParse(serviceId).success) {
		return { success: false, error: 'errors.invalidServiceId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError || !user) {
		redirect('/login')
	}

	const creatorId = await getCreatorId(supabase, user.id)
	if (!creatorId) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	const { data: service } = await supabase
		.from('services')
		.select('id, is_active, creator_id')
		.eq('id', serviceId)
		.eq('creator_id', creatorId)
		.single()

	if (!service) {
		return { success: false, error: 'errors.serviceNotFound' }
	}

	const newActive = !service.is_active

	const { error: updateError } = await supabase
		.from('services')
		.update({ is_active: newActive })
		.eq('id', serviceId)

	if (updateError) {
		console.error('[toggleServiceActive] update', updateError)
		return { success: false, error: 'errors.couldNotUpdateServiceStatus' }
	}

	revalidatePath('/dashboard/services')
	return { success: true, data: { isActive: newActive } }
}

export async function deleteService(serviceId: string): Promise<ActionResult> {
	if (!z.string().uuid().safeParse(serviceId).success) {
		return { success: false, error: 'errors.invalidServiceId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError || !user) {
		redirect('/login')
	}

	const creatorId = await getCreatorId(supabase, user.id)
	if (!creatorId) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	const { data: service } = await supabase
		.from('services')
		.select('id, creator_id')
		.eq('id', serviceId)
		.eq('creator_id', creatorId)
		.single()

	if (!service) {
		return { success: false, error: 'errors.serviceNotFound' }
	}

	const { data: media } = await supabase
		.from('service_media')
		.select('media_url')
		.eq('service_id', serviceId)

	if (media && media.length > 0) {
		const paths = media
			.map((m) => m.media_url.split('/media/')[1])
			.filter(Boolean) as string[]

		if (paths.length > 0) {
			await supabase.storage.from('media').remove(paths)
		}
	}

	const { error: deleteError } = await supabase
		.from('services')
		.delete()
		.eq('id', serviceId)

	if (deleteError) {
		console.error('[deleteService] delete', deleteError)
		return { success: false, error: 'errors.couldNotDeleteService' }
	}

	revalidatePath('/dashboard/services')
	return { success: true, data: undefined }
}
