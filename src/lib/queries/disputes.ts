import 'server-only'

import { cache } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

const bookingIdSchema = z.string().uuid()

export type DisputeListItem = {
	id: string
	reason: string
	status: string
	admin_note: string | null
	created_at: string
	resolved_at: string | null
	opened_by_name: string
	booking: {
		id: string
		title: string
		status: string
	}
	business_name: string
	creator_name: string
}

export async function getDisputes(
	statusFilter?: string,
): Promise<DisputeListItem[]> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return []

	if (user.app_metadata?.role !== 'admin') return []

	let query = supabase
		.from('disputes')
		.select(
			`
			id, reason, status, admin_note, created_at, resolved_at, opened_by,
			booking:bookings!disputes_booking_id_fkey(
				id, title, status,
				business:businesses!bookings_business_id_fkey(company_name),
				creator:creators!bookings_creator_id_fkey(display_name)
			)
		`,
		)
		.order('created_at', { ascending: false })

	if (statusFilter && statusFilter !== 'all') {
		query = query.eq(
			'status',
			statusFilter as Database['public']['Enums']['dispute_status'],
		)
	}

	const { data: disputes, error } = await query

	if (error || !disputes) {
		console.error('[getDisputes]', error)
		return []
	}

	const openerIds = [...new Set(disputes.map((d) => d.opened_by))]
	const { data: profiles } = await supabase
		.from('profiles')
		.select('id, full_name')
		.in('id', openerIds)

	const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? [])

	return disputes.map((d) => {
		const booking = d.booking as unknown as {
			id: string
			title: string
			status: string
			business: { company_name: string } | null
			creator: { display_name: string } | null
		}
		return {
			id: d.id,
			reason: d.reason,
			status: d.status,
			admin_note: d.admin_note,
			created_at: d.created_at,
			resolved_at: d.resolved_at,
			opened_by_name: profileMap.get(d.opened_by) ?? '',
			booking: {
				id: booking.id,
				title: booking.title,
				status: booking.status,
			},
			business_name: booking.business?.company_name ?? '',
			creator_name: booking.creator?.display_name ?? '',
		}
	})
}

export type DisputeDetail = {
	id: string
	reason: string
	status: string
	admin_note: string | null
	created_at: string
	resolved_at: string | null
	opened_by: string
	opened_by_name: string
	booking_id: string
}

export const getDisputeForBooking = cache(async function getDisputeForBooking(
	bookingId: string,
): Promise<DisputeDetail | null> {
	const parsed = bookingIdSchema.safeParse(bookingId)
	if (!parsed.success) return null

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return null

	const { data: dispute } = await supabase
		.from('disputes')
		.select(
			'id, reason, status, admin_note, created_at, resolved_at, opened_by, booking_id',
		)
		.eq('booking_id', parsed.data)
		.order('created_at', { ascending: false })
		.limit(1)
		.single()

	if (!dispute) return null

	const { data: profile } = await supabase
		.from('profiles')
		.select('full_name')
		.eq('id', dispute.opened_by)
		.single()

	return {
		...dispute,
		opened_by_name: profile?.full_name ?? '',
	}
})
