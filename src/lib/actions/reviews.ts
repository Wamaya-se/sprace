'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const createReviewSchema = z.object({
	bookingId: z.string().uuid(),
	rating: z.coerce.number().int().min(1).max(5),
	comment: z.string().max(2000).trim().optional(),
})

export async function createReview(
	formData: FormData,
): Promise<ActionResult<{ id: string }>> {
	const raw = {
		bookingId: formData.get('bookingId'),
		rating: formData.get('rating'),
		comment: formData.get('comment') || undefined,
	}

	const parsed = createReviewSchema.safeParse(raw)
	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue.path[0] as string,
		}
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const { data: booking } = await supabase
		.from('bookings')
		.select(
			`
			id, status, title,
			business:businesses!bookings_business_id_fkey(id, profile_id),
			creator:creators!bookings_creator_id_fkey(id, profile_id)
		`,
		)
		.eq('id', parsed.data.bookingId)
		.single()

	if (!booking) {
		return { success: false, error: 'errors.bookingNotFound' }
	}

	if (booking.status !== 'completed') {
		return { success: false, error: 'errors.bookingMustBeCompleted' }
	}

	const biz = booking.business as unknown as { id: string; profile_id: string }
	const crt = booking.creator as unknown as { id: string; profile_id: string }

	const isBusinessUser = biz.profile_id === user.id
	const isCreatorUser = crt.profile_id === user.id

	if (!isBusinessUser && !isCreatorUser) {
		return { success: false, error: 'errors.notParticipant' }
	}

	const revieweeId = isBusinessUser ? crt.profile_id : biz.profile_id

	const { data: existing } = await supabase
		.from('reviews')
		.select('id')
		.eq('booking_id', parsed.data.bookingId)
		.eq('reviewer_id', user.id)
		.single()

	if (existing) {
		return { success: false, error: 'errors.alreadyReviewed' }
	}

	const { data: review, error } = await supabase
		.from('reviews')
		.insert({
			booking_id: parsed.data.bookingId,
			reviewer_id: user.id,
			reviewee_id: revieweeId,
			rating: parsed.data.rating,
			comment: parsed.data.comment ?? null,
		})
		.select('id')
		.single()

	if (error) {
		console.error('[createReview]', error)
		return { success: false, error: 'errors.couldNotSubmitReview' }
	}

	const nt = await getTranslations('notifications')
	const { createNotification } = await import('@/lib/notifications')
	await createNotification({
		userId: revieweeId,
		type: 'review_received',
		title: nt('reviewReceived'),
		body: nt('reviewReceivedBody', {
			rating: String(parsed.data.rating),
			title: booking.title,
		} as never),
		link: `/dashboard/bookings/${parsed.data.bookingId}`,
	}).catch((err) => console.error('[createReview] notification failed', err))

	revalidatePath(`/dashboard/bookings/${parsed.data.bookingId}`)
	revalidatePath('/dashboard/reviews')
	return { success: true, data: { id: review.id } }
}

export type { ReviewItem, CreatorReviewItem } from '@/lib/queries/reviews'
