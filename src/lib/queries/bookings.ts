import 'server-only'

import { cache } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bookingIdSchema = z.string().uuid()

const bookingStatusSchema = z.enum([
	'pending',
	'awaiting_payment',
	'accepted',
	'in_progress',
	'delivered',
	'completed',
	'declined',
	'cancelled',
	'disputed',
])

export type BookingListItem = {
	id: string
	title: string
	status: string
	created_at: string
	updated_at: string
	budget: number | null
	deadline: string | null
	creator: { id: string; display_name: string } | null
	business: { id: string; company_name: string } | null
}

export async function getBookings(
	statusFilter?: string,
): Promise<BookingListItem[]> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return []

	const role = user.app_metadata?.role as string

	let query = supabase
		.from('bookings')
		.select(
			`
			id, title, status, created_at, updated_at, budget, deadline,
			creator:creators!bookings_creator_id_fkey(id, display_name),
			business:businesses!bookings_business_id_fkey(id, company_name)
		`,
		)
		.order('updated_at', { ascending: false })

	if (statusFilter && statusFilter !== 'all') {
		const validStatus = bookingStatusSchema.safeParse(statusFilter)
		if (validStatus.success) {
			query = query.eq('status', validStatus.data)
		}
	}

	if (role === 'business') {
		const { data: biz } = await supabase
			.from('businesses')
			.select('id')
			.eq('profile_id', user.id)
			.single()
		if (!biz) return []
		query = query.eq('business_id', biz.id)
	} else if (role === 'creator') {
		const { data: creator } = await supabase
			.from('creators')
			.select('id')
			.eq('profile_id', user.id)
			.single()
		if (!creator) return []
		query = query.eq('creator_id', creator.id)
	}

	const { data, error } = await query

	if (error) {
		console.error('[getBookings]', error)
		return []
	}

	return (data ?? []).map((b) => ({
		...b,
		creator: b.creator as unknown as BookingListItem['creator'],
		business: b.business as unknown as BookingListItem['business'],
	}))
}

export type BookingDetail = {
	id: string
	title: string
	description: string
	status: string
	created_at: string
	updated_at: string
	budget: number | null
	deadline: string | null
	service_id: string | null
	revision_count: number
	max_revisions: number
	creator: { id: string; display_name: string; profile_id: string } | null
	business: { id: string; company_name: string; profile_id: string } | null
	service: { id: string; name: string; price: number } | null
}

export const getBooking = cache(async function getBooking(
	bookingId: string,
): Promise<BookingDetail | null> {
	const parsed = bookingIdSchema.safeParse(bookingId)
	if (!parsed.success) return null

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return null

	const { data, error } = await supabase
		.from('bookings')
		.select(
			`
			id, title, description, status, created_at, updated_at, budget, deadline, service_id,
			revision_count, max_revisions,
			creator:creators!bookings_creator_id_fkey(id, display_name, profile_id),
			business:businesses!bookings_business_id_fkey(id, company_name, profile_id),
			service:services!bookings_service_id_fkey(id, name, price)
		`,
		)
		.eq('id', parsed.data)
		.single()

	if (error || !data) return null

	return {
		...data,
		creator: data.creator as unknown as BookingDetail['creator'],
		business: data.business as unknown as BookingDetail['business'],
		service: data.service as unknown as BookingDetail['service'],
	}
})
