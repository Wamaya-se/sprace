'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/guards'
import { CURRENT_TOUR_VERSION } from '@/lib/onboarding/version'
import type { ActionResult } from '@/types/actions'

/**
 * Persist that the user has seen or dismissed the current
 * onboarding tour. Idempotent — safe to call multiple times.
 */
export async function completeOnboardingTour(): Promise<ActionResult> {
	const { user, supabase } = await requireUser()

	const { error } = await supabase
		.from('profiles')
		.update({ tour_completed_version: CURRENT_TOUR_VERSION })
		.eq('id', user.id)

	if (error) {
		console.error('[completeOnboardingTour]', error)
		return { success: false, error: 'errors.couldNotUpdateSettings' }
	}

	revalidatePath('/dashboard')
	revalidatePath('/admin')
	return { success: true, data: undefined }
}

/**
 * Reset the stored tour version so the tour plays again on the
 * next dashboard/admin visit. Wired to the "Replay onboarding"
 * button in settings.
 */
export async function resetOnboardingTour(): Promise<ActionResult> {
	const { user, supabase } = await requireUser()

	const { error } = await supabase
		.from('profiles')
		.update({ tour_completed_version: null })
		.eq('id', user.id)

	if (error) {
		console.error('[resetOnboardingTour]', error)
		return { success: false, error: 'errors.couldNotUpdateSettings' }
	}

	revalidatePath('/dashboard')
	revalidatePath('/admin')
	revalidatePath('/dashboard/settings')
	return { success: true, data: undefined }
}
