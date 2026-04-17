import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Translates a Supabase/Postgrest error to a stable error key that the UI
 * can map to i18n strings. Keeps the original error in the console for
 * debugging without leaking low-level details to the user.
 */
export function translateSupabaseError(
	error: PostgrestError | null | undefined,
	context: string,
	fallback = 'errors.unknown',
): string {
	if (!error) return fallback
	console.error(`[${context}]`, error.code ?? '', error.message)

	if (error.code === '23505') return 'errors.conflict'
	if (error.code === '23503') return 'errors.foreignKeyViolation'
	if (error.code === '23514') return 'errors.checkConstraint'
	if (error.code === '42501') return 'errors.forbidden'
	if (error.code === 'PGRST116') return 'errors.notFound'
	return fallback
}
