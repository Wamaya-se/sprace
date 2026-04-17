import 'server-only'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type ReviewItem = {
	id: string
	rating: number
	comment: string | null
	created_at: string
	reviewer: {
		id: string
		full_name: string | null
		avatar_url: string | null
	} | null
}

export async function getBookingReviews(
	bookingId: string,
): Promise<ReviewItem[]> {
	const parsed = z.string().uuid().safeParse(bookingId)
	if (!parsed.success) return []

	const supabase = await createClient()

	const { data } = await supabase
		.from('reviews')
		.select(
			`
			id, rating, comment, created_at,
			reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url)
		`,
		)
		.eq('booking_id', parsed.data)
		.order('created_at', { ascending: false })

	return (data ?? []).map((r) => ({
		...r,
		reviewer: r.reviewer as unknown as ReviewItem['reviewer'],
	}))
}

export type CreatorReviewItem = {
	id: string
	rating: number
	comment: string | null
	created_at: string
	reviewer: {
		id: string
		full_name: string | null
		avatar_url: string | null
	} | null
	booking: { id: string; title: string } | null
}

export async function getCreatorReviews(creatorProfileId: string): Promise<{
	reviews: CreatorReviewItem[]
	averageRating: number | null
	totalCount: number
}> {
	const parsed = z.string().uuid().safeParse(creatorProfileId)
	if (!parsed.success)
		return { reviews: [], averageRating: null, totalCount: 0 }

	const supabase = await createClient()

	const { data, count } = await supabase
		.from('reviews')
		.select(
			`
			id, rating, comment, created_at,
			reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url),
			booking:bookings!reviews_booking_id_fkey(id, title)
		`,
			{ count: 'exact' },
		)
		.eq('reviewee_id', parsed.data)
		.order('created_at', { ascending: false })

	const reviews = (data ?? []).map((r) => ({
		...r,
		reviewer: r.reviewer as unknown as CreatorReviewItem['reviewer'],
		booking: r.booking as unknown as CreatorReviewItem['booking'],
	}))

	const totalCount = count ?? 0
	const averageRating =
		totalCount > 0
			? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
			: null

	return { reviews, averageRating, totalCount }
}

export async function getUserReviews(): Promise<{
	received: CreatorReviewItem[]
	given: CreatorReviewItem[]
}> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return { received: [], given: [] }

	const [receivedResult, givenResult] = await Promise.all([
		supabase
			.from('reviews')
			.select(
				`
				id, rating, comment, created_at,
				reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url),
				booking:bookings!reviews_booking_id_fkey(id, title)
			`,
			)
			.eq('reviewee_id', user.id)
			.order('created_at', { ascending: false }),
		supabase
			.from('reviews')
			.select(
				`
				id, rating, comment, created_at,
				reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url),
				booking:bookings!reviews_booking_id_fkey(id, title)
			`,
			)
			.eq('reviewer_id', user.id)
			.order('created_at', { ascending: false }),
	])

	const mapReview = (
		r: typeof receivedResult.data extends (infer T)[] | null ? T : never,
	) => ({
		...r,
		reviewer: r.reviewer as unknown as CreatorReviewItem['reviewer'],
		booking: r.booking as unknown as CreatorReviewItem['booking'],
	})

	return {
		received: (receivedResult.data ?? []).map(mapReview),
		given: (givenResult.data ?? []).map(mapReview),
	}
}
