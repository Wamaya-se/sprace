import { z, type ZodError } from 'zod'
import type { ActionResult } from '@/types/actions'

/**
 * Zod schema for any UUID (used for path/form id params).
 */
export const uuidSchema = z.string().uuid()

/**
 * Extracts a safe `{ error, field }` payload from a Zod error for
 * returning via ActionResult. Defaults to the generic invalidInput key.
 */
export function zodFieldError<T>(
	error: ZodError<T>,
	fallback = 'errors.invalidInput',
): Extract<ActionResult, { success: false }> {
	const first = error.issues[0]
	return {
		success: false,
		error: fallback,
		field: first?.path[0] as string | undefined,
	}
}
