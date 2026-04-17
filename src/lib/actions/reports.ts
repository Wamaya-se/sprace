'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requireUser } from '@/lib/auth/guards'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import {
	createReportSchema,
	type CreateReportInput,
} from '@/lib/validation/moderation'
import type { ActionResult } from '@/types/actions'

export async function createReport(
	input: CreateReportInput,
): Promise<ActionResult<{ id: string }>> {
	const parsed = createReportSchema.safeParse(input)
	if (!parsed.success) {
		const firstError = parsed.error.issues[0]
		const field = firstError?.path[0] as string | undefined
		return {
			success: false,
			error:
				field === 'reason'
					? 'errors.reportReasonRequired'
					: 'errors.invalidReport',
			...(field ? { field } : {}),
		}
	}

	const { user, supabase } = await requireUser()

	const h = await headers()
	const rl = await checkRateLimit(
		'action',
		`report:${getClientIp(h)}:${user.id}`,
	)
	if (!rl.success) {
		return { success: false, error: 'errors.tooManyRequests' }
	}

	if (parsed.data.targetType === 'profile') {
		if (parsed.data.targetId === user.id) {
			return { success: false, error: 'errors.cannotReportSelf' }
		}
		const { data: profile } = await supabase
			.from('profiles')
			.select('id')
			.eq('id', parsed.data.targetId)
			.single()
		if (!profile) {
			return { success: false, error: 'errors.profileNotFound' }
		}
	} else {
		const { data: booking } = await supabase
			.from('bookings')
			.select(
				`id,
				business:businesses!bookings_business_id_fkey(profile_id),
				creator:creators!bookings_creator_id_fkey(profile_id)`,
			)
			.eq('id', parsed.data.targetId)
			.single()

		if (!booking) {
			return { success: false, error: 'errors.bookingNotFound' }
		}

		const business = booking.business as { profile_id: string } | null
		const creator = booking.creator as { profile_id: string } | null
		const isParticipant =
			business?.profile_id === user.id || creator?.profile_id === user.id

		if (!isParticipant) {
			return { success: false, error: 'errors.notAuthorized' }
		}
	}

	const { data: report, error } = await supabase
		.from('reports')
		.insert({
			reporter_id: user.id,
			target_type: parsed.data.targetType,
			target_id: parsed.data.targetId,
			category: parsed.data.category,
			reason: parsed.data.reason,
			status: 'pending',
		})
		.select('id')
		.single()

	if (error || !report) {
		if (error?.code === '23505') {
			return { success: false, error: 'errors.alreadyReported' }
		}
		console.error('[createReport]', error)
		return { success: false, error: 'errors.couldNotCreateReport' }
	}

	revalidatePath('/admin/reports')
	return { success: true, data: { id: report.id } }
}
