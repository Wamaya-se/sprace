/**
 * Pure state machine for booking status transitions.
 *
 * Kept free of any server-only imports so it can be unit-tested and shared
 * between server actions, middleware, and UI guards.
 */

export type BookingStatus =
	| 'pending'
	| 'awaiting_payment'
	| 'accepted'
	| 'in_progress'
	| 'delivered'
	| 'completed'
	| 'declined'
	| 'cancelled'
	| 'disputed'

export type BookingRole = 'business' | 'creator'

interface TransitionConfig {
	allowedNext: BookingStatus[]
}

export const statusTransitions: Record<BookingStatus, TransitionConfig> = {
	pending: { allowedNext: ['awaiting_payment', 'declined', 'cancelled'] },
	awaiting_payment: { allowedNext: ['accepted', 'cancelled'] },
	accepted: { allowedNext: ['in_progress', 'cancelled'] },
	in_progress: { allowedNext: ['delivered', 'cancelled'] },
	delivered: { allowedNext: ['completed', 'in_progress'] },
	completed: { allowedNext: [] },
	declined: { allowedNext: [] },
	cancelled: { allowedNext: [] },
	disputed: { allowedNext: [] },
}

export const roleAllowedTransitions: Record<
	BookingRole,
	Partial<Record<BookingStatus, boolean>>
> = {
	business: {
		cancelled: true,
		completed: true,
		in_progress: true,
		accepted: true,
	},
	creator: {
		awaiting_payment: true,
		declined: true,
		cancelled: true,
		in_progress: true,
		delivered: true,
	},
}

export type TransitionCheck =
	| { ok: true }
	| { ok: false; reason: 'invalidTransition' | 'notAllowedForRole' }

export function canTransition(
	current: BookingStatus,
	next: BookingStatus,
	role: BookingRole,
): TransitionCheck {
	const transition = statusTransitions[current]
	if (!transition || !transition.allowedNext.includes(next)) {
		return { ok: false, reason: 'invalidTransition' }
	}
	if (!roleAllowedTransitions[role][next]) {
		return { ok: false, reason: 'notAllowedForRole' }
	}
	return { ok: true }
}
