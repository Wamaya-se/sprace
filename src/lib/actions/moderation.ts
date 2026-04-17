'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import {
	resolveReportSchema,
	suspendUserSchema,
	type ResolveReportInput,
} from '@/lib/validation/moderation'
import type { ActionResult } from '@/types/actions'

const reportIdSchema = z.string().uuid()
const userIdSchema = z.string().uuid()

export async function resolveReport(
	reportId: string,
	input: ResolveReportInput,
): Promise<ActionResult> {
	const parsedId = reportIdSchema.safeParse(reportId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidReportId' }
	}

	const parsed = resolveReportSchema.safeParse(input)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidReportResolution' }
	}

	const { user, supabase } = await requireAdmin()

	const { data: report } = await supabase
		.from('reports')
		.select('id, status, reporter_id, target_type, target_id')
		.eq('id', parsedId.data)
		.single()

	if (!report) {
		return { success: false, error: 'errors.reportNotFound' }
	}

	const isTerminal =
		parsed.data.status === 'resolved' || parsed.data.status === 'dismissed'

	const { error } = await supabase
		.from('reports')
		.update({
			status: parsed.data.status,
			admin_note: parsed.data.adminNote ?? null,
			resolved_by: isTerminal ? user.id : null,
			resolved_at: isTerminal ? new Date().toISOString() : null,
		})
		.eq('id', parsedId.data)

	if (error) {
		console.error('[resolveReport]', error)
		return { success: false, error: 'errors.couldNotResolveReport' }
	}

	if (isTerminal) {
		try {
			const nt = await getTranslations('notifications')
			await createNotification({
				userId: report.reporter_id,
				type: 'report_resolved',
				title: nt('reportResolved'),
				body:
					parsed.data.status === 'resolved'
						? nt('reportResolvedBody')
						: nt('reportDismissedBody'),
				link: '/dashboard',
			})
		} catch (err) {
			console.error('[resolveReport] notification failed', err)
		}
	}

	revalidatePath('/admin/reports')
	return { success: true, data: undefined }
}

export async function suspendUser(
	targetUserId: string,
	reason: string,
): Promise<ActionResult> {
	const parsedId = userIdSchema.safeParse(targetUserId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidUserId' }
	}

	const parsed = suspendUserSchema.safeParse({ reason })
	if (!parsed.success) {
		return { success: false, error: 'errors.suspensionReasonRequired' }
	}

	const { user, supabase } = await requireAdmin()

	if (parsedId.data === user.id) {
		return { success: false, error: 'errors.cannotSuspendSelf' }
	}

	const { data: target } = await supabase
		.from('profiles')
		.select('id, role, full_name, email')
		.eq('id', parsedId.data)
		.single()

	if (!target) {
		return { success: false, error: 'errors.profileNotFound' }
	}

	if (target.role === 'admin') {
		return { success: false, error: 'errors.cannotSuspendAdmin' }
	}

	const { error: profileError } = await supabase
		.from('profiles')
		.update({
			is_suspended: true,
			suspended_at: new Date().toISOString(),
			suspended_by: user.id,
			suspension_reason: parsed.data.reason,
		})
		.eq('id', parsedId.data)

	if (profileError) {
		console.error('[suspendUser] profile update failed', profileError)
		return { success: false, error: 'errors.couldNotSuspendUser' }
	}

	if (target.role === 'creator') {
		const { error: creatorError } = await supabase
			.from('creators')
			.update({ status: 'suspended' })
			.eq('profile_id', parsedId.data)
		if (creatorError) {
			console.error('[suspendUser] creator update failed', creatorError)
		}
	}

	const admin = createAdminClient()
	const { error: signOutError } = await admin.auth.admin.signOut(parsedId.data)
	if (signOutError) {
		console.error('[suspendUser] signOut failed', signOutError)
	}

	try {
		const nt = await getTranslations('notifications')
		await createNotification({
			userId: parsedId.data,
			type: 'account_suspended',
			title: nt('accountSuspended'),
			body: nt('accountSuspendedBody', { reason: parsed.data.reason }),
		})
	} catch (err) {
		console.error('[suspendUser] notification failed', err)
	}

	revalidatePath('/admin/reports')
	revalidatePath('/admin/users')
	revalidatePath(`/admin/users/${parsedId.data}`)

	return { success: true, data: undefined }
}

export async function unsuspendUser(
	targetUserId: string,
): Promise<ActionResult> {
	const parsedId = userIdSchema.safeParse(targetUserId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidUserId' }
	}

	const { supabase } = await requireAdmin()

	const { data: target } = await supabase
		.from('profiles')
		.select('id, role, is_suspended')
		.eq('id', parsedId.data)
		.single()

	if (!target) {
		return { success: false, error: 'errors.profileNotFound' }
	}

	if (!target.is_suspended) {
		return { success: true, data: undefined }
	}

	const { error: profileError } = await supabase
		.from('profiles')
		.update({
			is_suspended: false,
			suspended_at: null,
			suspended_by: null,
			suspension_reason: null,
		})
		.eq('id', parsedId.data)

	if (profileError) {
		console.error('[unsuspendUser] profile update failed', profileError)
		return { success: false, error: 'errors.couldNotUnsuspendUser' }
	}

	if (target.role === 'creator') {
		const { error: creatorError } = await supabase
			.from('creators')
			.update({ status: 'active' })
			.eq('profile_id', parsedId.data)
			.eq('status', 'suspended')
		if (creatorError) {
			console.error('[unsuspendUser] creator update failed', creatorError)
		}
	}

	revalidatePath('/admin/reports')
	revalidatePath('/admin/users')
	revalidatePath(`/admin/users/${parsedId.data}`)

	return { success: true, data: undefined }
}
