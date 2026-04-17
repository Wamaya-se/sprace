import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export type ReportStatus = Database['public']['Enums']['report_status']
export type ReportCategory = Database['public']['Enums']['report_category']
export type ReportTargetType = Database['public']['Enums']['report_target_type']

export type ReportListItem = {
	id: string
	reporter_id: string
	reporter_name: string
	target_type: ReportTargetType
	target_id: string
	target_label: string
	target_link: string | null
	target_owner_id: string | null
	category: ReportCategory
	reason: string
	status: ReportStatus
	admin_note: string | null
	created_at: string
	resolved_at: string | null
}

function isNotNull<T>(v: T | null | undefined): v is T {
	return v != null
}

export const getReports = cache(async function getReports(
	statusFilter?: ReportStatus | 'all',
): Promise<ReportListItem[]> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user || user.app_metadata?.role !== 'admin') return []

	let query = supabase
		.from('reports')
		.select(
			'id, reporter_id, target_type, target_id, category, reason, status, admin_note, created_at, resolved_at',
		)
		.order('created_at', { ascending: false })
		.limit(200)

	if (statusFilter && statusFilter !== 'all') {
		query = query.eq('status', statusFilter)
	}

	const { data: reports, error } = await query

	if (error || !reports) {
		console.error('[getReports]', error)
		return []
	}

	const reporterIds = [...new Set(reports.map((r) => r.reporter_id))]
	const profileTargetIds = reports
		.filter((r) => r.target_type === 'profile')
		.map((r) => r.target_id)
	const bookingTargetIds = reports
		.filter((r) => r.target_type === 'booking')
		.map((r) => r.target_id)

	const profileLookupIds = [...new Set([...reporterIds, ...profileTargetIds])]

	const [{ data: profiles }, { data: bookings }] = await Promise.all([
		profileLookupIds.length > 0
			? supabase
					.from('profiles')
					.select('id, full_name, email, is_suspended')
					.in('id', profileLookupIds)
			: Promise.resolve({ data: [] }),
		bookingTargetIds.length > 0
			? supabase
					.from('bookings')
					.select(
						`id, title,
						business:businesses!bookings_business_id_fkey(profile_id, company_name),
						creator:creators!bookings_creator_id_fkey(profile_id, display_name)`,
					)
					.in('id', bookingTargetIds)
			: Promise.resolve({ data: [] }),
	])

	const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
	const bookingMap = new Map(
		(bookings ?? []).map((b) => [
			b.id,
			b as unknown as {
				id: string
				title: string
				business: { profile_id: string; company_name: string } | null
				creator: { profile_id: string; display_name: string } | null
			},
		]),
	)

	return reports
		.map<ReportListItem | null>((r) => {
			const reporter = profileMap.get(r.reporter_id)
			let target_label = ''
			let target_link: string | null = null
			let target_owner_id: string | null = null

			if (r.target_type === 'profile') {
				const p = profileMap.get(r.target_id)
				target_label = p?.full_name ?? p?.email ?? r.target_id
				target_owner_id = r.target_id
			} else {
				const b = bookingMap.get(r.target_id)
				target_label = b?.title ?? r.target_id
				target_link = `/dashboard/bookings/${r.target_id}`
				target_owner_id = b?.creator?.profile_id ?? null
			}

			return {
				id: r.id,
				reporter_id: r.reporter_id,
				reporter_name: reporter?.full_name ?? reporter?.email ?? '',
				target_type: r.target_type,
				target_id: r.target_id,
				target_label,
				target_link,
				target_owner_id,
				category: r.category,
				reason: r.reason,
				status: r.status,
				admin_note: r.admin_note,
				created_at: r.created_at,
				resolved_at: r.resolved_at,
			}
		})
		.filter(isNotNull)
})
