'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const booleanSchema = z.boolean()

export async function updateEmailNotifications(
	enabled: boolean,
): Promise<ActionResult> {
	const parsed = booleanSchema.safeParse(enabled)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidValue' }
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
		.from('profiles')
		.update({ email_notifications: parsed.data })
		.eq('id', user.id)

	if (error) {
		console.error('[updateEmailNotifications]', error)
		return { success: false, error: 'errors.couldNotUpdateSettings' }
	}

	revalidatePath('/dashboard/settings')
	return { success: true, data: undefined }
}
