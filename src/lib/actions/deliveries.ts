'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

export { approveDelivery, requestRevision } from '@/lib/actions/delivery-review'
export type { DeliveryItem } from '@/lib/queries/deliveries'

const bookingIdSchema = z.string().uuid()

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_FILES = 10
const ALLOWED_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'video/mp4',
	'video/quicktime',
	'video/webm',
	'application/pdf',
	'application/zip',
]

export async function createDelivery(
	formData: FormData,
): Promise<ActionResult<{ id: string }>> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) redirect('/login')

	if (user.app_metadata?.role !== 'creator') {
		return { success: false, error: 'errors.onlyCreatorCanDeliver' }
	}

	const rawBookingId = formData.get('bookingId')
	const parsedBookingId = bookingIdSchema.safeParse(rawBookingId)
	if (!parsedBookingId.success) {
		return { success: false, error: 'errors.invalidBookingId' }
	}

	const comment = z
		.string()
		.max(2000)
		.trim()
		.optional()
		.safeParse(formData.get('comment') || undefined)

	const { data: booking } = await supabase
		.from('bookings')
		.select(
			`id, status, creator_id, business_id, title, max_revisions, revision_count,
			creator:creators!bookings_creator_id_fkey(profile_id),
			business:businesses!bookings_business_id_fkey(profile_id)`,
		)
		.eq('id', parsedBookingId.data)
		.single()

	if (!booking) {
		return { success: false, error: 'errors.bookingNotFound' }
	}

	const creator = booking.creator as unknown as { profile_id: string } | null
	if (creator?.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	if (booking.status !== 'in_progress') {
		return { success: false, error: 'errors.bookingMustBeInProgress' }
	}

	const files: File[] = []
	const fileEntries = formData.getAll('files')
	for (const entry of fileEntries) {
		if (entry instanceof File && entry.size > 0) {
			files.push(entry)
		}
	}

	if (files.length === 0) {
		return { success: false, error: 'errors.fileRequired', field: 'files' }
	}

	if (files.length > MAX_FILES) {
		return {
			success: false,
			error: 'errors.maxFilesPerDelivery',
			field: 'files',
		}
	}

	for (const file of files) {
		if (file.size > MAX_FILE_SIZE) {
			return {
				success: false,
				error: 'errors.fileExceedsLimit',
				field: 'files',
			}
		}
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return {
				success: false,
				error: 'errors.fileTypeNotSupported',
				field: 'files',
			}
		}
	}

	const { data: latestDelivery } = await supabase
		.from('booking_deliveries')
		.select('version')
		.eq('booking_id', parsedBookingId.data)
		.order('version', { ascending: false })
		.limit(1)
		.single()

	const nextVersion = (latestDelivery?.version ?? 0) + 1

	const { data: delivery, error: insertError } = await supabase
		.from('booking_deliveries')
		.insert({
			booking_id: parsedBookingId.data,
			version: nextVersion,
			comment: comment.success ? (comment.data ?? null) : null,
			status: 'submitted',
			submitted_by: user.id,
		})
		.select('id')
		.single()

	if (insertError || !delivery) {
		console.error('[createDelivery]', insertError)
		return { success: false, error: 'errors.couldNotCreateDelivery' }
	}

	const uploadedPaths: string[] = []
	const uploadedFiles: Array<{
		delivery_id: string
		file_url: string
		file_name: string
		file_size: number
		mime_type: string
		sort_order: number
	}> = []

	const rollback = async (reason: string, err?: unknown) => {
		console.error(`[createDelivery] rollback: ${reason}`, err)
		if (uploadedPaths.length > 0) {
			await supabase.storage
				.from('media')
				.remove(uploadedPaths)
				.catch((e) =>
					console.error('[createDelivery] rollback storage cleanup', e),
				)
		}
		await supabase
			.from('booking_deliveries')
			.delete()
			.eq('id', delivery.id)
			.then(({ error: delErr }) => {
				if (delErr) {
					console.error('[createDelivery] rollback delivery delete', delErr)
				}
			})
	}

	for (let i = 0; i < files.length; i++) {
		const file = files[i]
		const ext = file.name.split('.').pop() ?? 'bin'
		const storagePath = `${user.id}/deliveries/${parsedBookingId.data}/${delivery.id}/${i}.${ext}`

		const { error: uploadError } = await supabase.storage
			.from('media')
			.upload(storagePath, file, {
				cacheControl: '3600',
				upsert: false,
				contentType: file.type,
			})

		if (uploadError) {
			await rollback('file upload failed', uploadError)
			return { success: false, error: 'errors.fileUploadFailed' }
		}

		uploadedPaths.push(storagePath)

		const { data: publicUrl } = supabase.storage
			.from('media')
			.getPublicUrl(storagePath)

		uploadedFiles.push({
			delivery_id: delivery.id,
			file_url: publicUrl.publicUrl,
			file_name: file.name,
			file_size: file.size,
			mime_type: file.type,
			sort_order: i,
		})
	}

	const { error: filesError } = await supabase
		.from('delivery_files')
		.insert(uploadedFiles)

	if (filesError) {
		await rollback('delivery_files insert failed', filesError)
		return { success: false, error: 'errors.couldNotCreateDelivery' }
	}

	const { error: statusError } = await supabase
		.from('bookings')
		.update({ status: 'delivered' })
		.eq('id', parsedBookingId.data)

	if (statusError) {
		console.error('[createDelivery] status update failed', statusError)
	}

	const t = await getTranslations('bookings')
	const { data: conversation } = await supabase
		.from('conversations')
		.select('id')
		.eq('booking_id', parsedBookingId.data)
		.single()

	if (conversation) {
		await supabase
			.from('messages')
			.insert({
				conversation_id: conversation.id,
				sender_id: user.id,
				content: t('systemDeliverySubmitted', { version: String(nextVersion) }),
				is_system: true,
			})
			.then(() =>
				supabase
					.from('conversations')
					.update({ last_message_at: new Date().toISOString() })
					.eq('id', conversation.id),
			)
	}

	const business = booking.business as unknown as { profile_id: string } | null
	if (business) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await createNotification({
			userId: business.profile_id,
			type: 'delivery_submitted',
			title: nt('deliverySubmitted'),
			body: nt('deliverySubmittedBody', {
				title: booking.title,
				version: String(nextVersion),
			}),
			link: `/dashboard/bookings/${parsedBookingId.data}`,
		}).catch((err) =>
			console.error('[createDelivery] notification failed', err),
		)
	}

	revalidatePath(`/dashboard/bookings/${parsedBookingId.data}`)
	revalidatePath('/dashboard/bookings')
	revalidatePath('/dashboard/messages')
	return { success: true, data: { id: delivery.id } }
}
