'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const creatorIdSchema = z.string().uuid()

export async function saveCreator(creatorId: string): Promise<ActionResult> {
	const parsed = creatorIdSchema.safeParse(creatorId)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidCreatorId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.onlyBusinessCanSave' }
	}

	const { error } = await supabase.from('saved_creators').insert({
		business_profile_id: user.id,
		creator_id: parsed.data,
	})

	if (error) {
		if (error.code === '23505') {
			return { success: true, data: undefined }
		}
		console.error('[saveCreator]', error)
		return { success: false, error: 'errors.couldNotSaveCreator' }
	}

	revalidatePath('/dashboard/discover')
	revalidatePath('/dashboard/saved')
	return { success: true, data: undefined }
}

export async function unsaveCreator(creatorId: string): Promise<ActionResult> {
	const parsed = creatorIdSchema.safeParse(creatorId)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidCreatorId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const { error } = await supabase
		.from('saved_creators')
		.delete()
		.eq('business_profile_id', user.id)
		.eq('creator_id', parsed.data)

	if (error) {
		console.error('[unsaveCreator]', error)
		return { success: false, error: 'errors.couldNotRemoveCreator' }
	}

	revalidatePath('/dashboard/discover')
	revalidatePath('/dashboard/saved')
	return { success: true, data: undefined }
}
