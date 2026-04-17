'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/guards'
import type { ActionResult } from '@/types/actions'

const updateRoleSchema = z.object({
	userId: z.string().uuid(),
	role: z.enum(['creator', 'business', 'admin']),
})

export async function updateUserRole(
	userId: string,
	role: 'creator' | 'business' | 'admin',
): Promise<ActionResult> {
	const { user, supabase } = await requireAdmin()

	const parsed = updateRoleSchema.safeParse({ userId, role })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	if (parsed.data.userId === user.id) {
		return { success: false, error: 'errors.cannotChangeOwnRole' }
	}

	const { data: previousProfile, error: readError } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', parsed.data.userId)
		.single()

	if (readError || !previousProfile) {
		return { success: false, error: 'errors.userNotFound' }
	}

	const { error: updateError } = await supabase
		.from('profiles')
		.update({ role: parsed.data.role })
		.eq('id', parsed.data.userId)

	if (updateError) {
		console.error('[updateUserRole]', updateError)
		return { success: false, error: 'errors.couldNotUpdateRole' }
	}

	const adminClient = createAdminClient()
	const { error: metaError } = await adminClient.auth.admin.updateUserById(
		parsed.data.userId,
		{ app_metadata: { role: parsed.data.role } },
	)

	if (metaError) {
		console.error(
			'[updateUserRole] app_metadata sync failed, rolling back',
			metaError,
		)
		await supabase
			.from('profiles')
			.update({ role: previousProfile.role })
			.eq('id', parsed.data.userId)
		return { success: false, error: 'errors.couldNotUpdateRole' }
	}

	revalidatePath('/admin/users')
	revalidatePath(`/admin/users/${parsed.data.userId}`)
	return { success: true, data: undefined }
}

const updateStatusSchema = z.object({
	creatorId: z.string().uuid(),
	status: z.enum(['draft', 'pending_review', 'active', 'suspended']),
})

export async function updateCreatorStatus(
	creatorId: string,
	status: 'draft' | 'pending_review' | 'active' | 'suspended',
): Promise<ActionResult> {
	const { supabase } = await requireAdmin()

	const parsed = updateStatusSchema.safeParse({ creatorId, status })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const { error: updateError } = await supabase
		.from('creators')
		.update({ status: parsed.data.status })
		.eq('id', parsed.data.creatorId)

	if (updateError) {
		console.error('[updateCreatorStatus]', updateError)
		return { success: false, error: 'errors.couldNotUpdateCreatorStatus' }
	}

	revalidatePath('/admin')
	revalidatePath('/admin/users')
	revalidatePath('/admin/creators')
	revalidateTag('creators', 'max')
	revalidateTag('landing-stats', 'max')
	return { success: true, data: undefined }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
	const { user } = await requireAdmin()

	if (!z.string().uuid().safeParse(userId).success) {
		return { success: false, error: 'errors.invalidUserId' }
	}

	if (userId === user.id) {
		return { success: false, error: 'errors.cannotDeleteOwnAccount' }
	}

	const adminClient = createAdminClient()
	const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

	if (deleteError) {
		console.error('[deleteUser]', deleteError)
		return { success: false, error: 'errors.couldNotDeleteUser' }
	}

	revalidatePath('/admin')
	revalidatePath('/admin/users')
	return { success: true, data: undefined }
}

// ---------- Business org.nr verification (DAC7) ----------

const verifyOrgSchema = z.object({
	businessId: z.string().uuid(),
	decision: z.enum(['verified', 'rejected', 'pending', 'unverified']),
	note: z.preprocess(
		(v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
		z.string().trim().max(500).optional(),
	),
})

export async function verifyBusinessOrgNumber(
	businessId: string,
	decision: 'verified' | 'rejected' | 'pending' | 'unverified',
	note?: string,
): Promise<ActionResult> {
	const { user, supabase } = await requireAdmin()

	const parsed = verifyOrgSchema.safeParse({ businessId, decision, note })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const { data: business, error: readError } = await supabase
		.from('businesses')
		.select('id, profile_id, org_number')
		.eq('id', parsed.data.businessId)
		.single()

	if (readError || !business) {
		return { success: false, error: 'errors.businessNotFound' }
	}

	if (
		(parsed.data.decision === 'verified' ||
			parsed.data.decision === 'pending') &&
		!business.org_number
	) {
		return { success: false, error: 'errors.orgNumberMissing' }
	}

	const { error: updateError } = await supabase
		.from('businesses')
		.update({
			org_number_verification: parsed.data.decision,
			org_number_verified_at:
				parsed.data.decision === 'verified' ? new Date().toISOString() : null,
			org_number_verified_by:
				parsed.data.decision === 'verified' ? user.id : null,
			org_number_verification_note: parsed.data.note ?? null,
		})
		.eq('id', parsed.data.businessId)

	if (updateError) {
		console.error('[verifyBusinessOrgNumber]', updateError)
		return { success: false, error: 'errors.couldNotVerifyOrgNumber' }
	}

	revalidatePath('/admin/users')
	revalidatePath(`/admin/users/${business.profile_id}`)
	return { success: true, data: undefined }
}
