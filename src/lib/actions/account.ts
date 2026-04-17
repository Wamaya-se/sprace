'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { participantOrFilter } from '@/lib/db/filters'
import type { ActionResult } from '@/types/actions'

const confirmSchema = z.literal('DELETE')

export async function deleteOwnAccount(
	confirmation: string,
): Promise<ActionResult> {
	const parsed = confirmSchema.safeParse(confirmation)
	if (!parsed.success) {
		return { success: false, error: 'errors.confirmDeleteRequired' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) redirect('/login')

	const role = user.app_metadata?.role as string

	if (role === 'creator') {
		const { data: creator } = await supabase
			.from('creators')
			.select('stripe_account_id')
			.eq('profile_id', user.id)
			.single()

		if (creator?.stripe_account_id) {
			try {
				const { getStripe } = await import('@/lib/stripe')
				await getStripe().accounts.del(creator.stripe_account_id)
			} catch (err) {
				console.error('[deleteOwnAccount] Stripe cleanup failed', err)
			}
		}
	}

	try {
		const { data: files } = await supabase.storage
			.from('media')
			.list(user.id, { limit: 1000 })

		if (files && files.length > 0) {
			const paths = files.map((f) => `${user.id}/${f.name}`)
			await supabase.storage.from('media').remove(paths)
		}
	} catch (err) {
		console.error('[deleteOwnAccount] Storage cleanup failed', err)
	}

	const adminClient = createAdminClient()
	const { error: deleteError } = await adminClient.auth.admin.deleteUser(
		user.id,
	)

	if (deleteError) {
		console.error('[deleteOwnAccount]', deleteError)
		return { success: false, error: 'errors.couldNotDeleteAccount' }
	}

	await supabase.auth.signOut()
	redirect('/login?deleted=true')
}

export async function exportAccountData(): Promise<
	ActionResult<{
		profile: Record<string, unknown>
		bookings: Record<string, unknown>[]
		messages: Record<string, unknown>[]
		reviews: Record<string, unknown>[]
		notifications: Record<string, unknown>[]
	}>
> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) redirect('/login')

	const role = user.app_metadata?.role as string

	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single()

	let roleData: Record<string, unknown> | null = null
	if (role === 'creator') {
		const { data } = await supabase
			.from('creators')
			.select('*, services(*)')
			.eq('profile_id', user.id)
			.single()
		roleData = data as Record<string, unknown> | null
	} else if (role === 'business') {
		const { data } = await supabase
			.from('businesses')
			.select('*')
			.eq('profile_id', user.id)
			.single()
		roleData = data as Record<string, unknown> | null
	}

	let entityId: string | null = null
	if (role === 'creator') {
		const { data: c } = await supabase
			.from('creators')
			.select('id')
			.eq('profile_id', user.id)
			.single()
		entityId = c?.id ?? null
	} else if (role === 'business') {
		const { data: b } = await supabase
			.from('businesses')
			.select('id')
			.eq('profile_id', user.id)
			.single()
		entityId = b?.id ?? null
	}

	let bookings: Record<string, unknown>[] = []
	if (entityId) {
		const col = role === 'creator' ? 'creator_id' : 'business_id'
		const { data } = await supabase
			.from('bookings')
			.select('*')
			.eq(col, entityId)
			.order('created_at', { ascending: false })
		bookings = (data ?? []) as Record<string, unknown>[]
	}

	const { data: conversations } = await supabase
		.from('conversations')
		.select('id')
		.or(participantOrFilter(user.id))

	const conversationIds = conversations?.map((c) => c.id) ?? []
	let messages: Record<string, unknown>[] = []
	if (conversationIds.length > 0) {
		const { data } = await supabase
			.from('messages')
			.select('*')
			.in('conversation_id', conversationIds)
			.eq('sender_id', user.id)
			.order('created_at', { ascending: false })
		messages = (data ?? []) as Record<string, unknown>[]
	}

	const { data: reviews } = await supabase
		.from('reviews')
		.select('*')
		.eq('reviewer_id', user.id)
		.order('created_at', { ascending: false })

	const { data: notifications } = await supabase
		.from('notifications')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(500)

	const exportData = {
		profile: {
			...((profile as Record<string, unknown>) ?? {}),
			role_details: roleData,
		},
		bookings,
		messages,
		reviews: (reviews ?? []) as Record<string, unknown>[],
		notifications: (notifications ?? []) as Record<string, unknown>[],
	}

	return { success: true, data: exportData }
}
