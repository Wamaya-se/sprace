/**
 * Pure state machines for campaign and application status transitions.
 *
 * Kept free of any server-only imports so it can be unit-tested and
 * shared between server actions, middleware, and UI guards.
 */

export type CampaignStatus =
	| 'draft'
	| 'open'
	| 'closed'
	| 'completed'
	| 'cancelled'

export type ApplicationStatus =
	| 'pending'
	| 'shortlisted'
	| 'accepted'
	| 'declined'
	| 'withdrawn'

interface TransitionConfig<TStatus extends string> {
	allowedNext: TStatus[]
}

export const campaignStatusTransitions: Record<
	CampaignStatus,
	TransitionConfig<CampaignStatus>
> = {
	draft: { allowedNext: ['open', 'cancelled'] },
	open: { allowedNext: ['closed', 'cancelled'] },
	closed: { allowedNext: ['completed', 'cancelled'] },
	completed: { allowedNext: [] },
	cancelled: { allowedNext: [] },
}

export const applicationStatusTransitions: Record<
	ApplicationStatus,
	TransitionConfig<ApplicationStatus>
> = {
	pending: {
		allowedNext: ['shortlisted', 'accepted', 'declined', 'withdrawn'],
	},
	shortlisted: { allowedNext: ['accepted', 'declined', 'withdrawn'] },
	accepted: { allowedNext: [] },
	declined: { allowedNext: [] },
	withdrawn: { allowedNext: [] },
}

export type CampaignRole = 'business' | 'creator'

export const applicationRoleAllowedTransitions: Record<
	CampaignRole,
	Partial<Record<ApplicationStatus, boolean>>
> = {
	business: {
		shortlisted: true,
		accepted: true,
		declined: true,
	},
	creator: {
		withdrawn: true,
	},
}

export type TransitionCheck =
	| { ok: true }
	| { ok: false; reason: 'invalidTransition' | 'notAllowedForRole' }

export function canTransitionCampaign(
	current: CampaignStatus,
	next: CampaignStatus,
): TransitionCheck {
	const transition = campaignStatusTransitions[current]
	if (!transition || !transition.allowedNext.includes(next)) {
		return { ok: false, reason: 'invalidTransition' }
	}
	return { ok: true }
}

export function canTransitionApplication(
	current: ApplicationStatus,
	next: ApplicationStatus,
	role: CampaignRole,
): TransitionCheck {
	const transition = applicationStatusTransitions[current]
	if (!transition || !transition.allowedNext.includes(next)) {
		return { ok: false, reason: 'invalidTransition' }
	}
	if (!applicationRoleAllowedTransitions[role][next]) {
		return { ok: false, reason: 'notAllowedForRole' }
	}
	return { ok: true }
}

/**
 * Can a creator submit a new application on a campaign?
 * Requires an open campaign and no existing non-terminal application.
 */
export function canApply(
	campaignStatus: CampaignStatus,
	existingApplicationStatus: ApplicationStatus | null,
): boolean {
	if (campaignStatus !== 'open') {
		return false
	}
	if (existingApplicationStatus === null) {
		return true
	}
	return existingApplicationStatus === 'withdrawn'
}

/**
 * Is a campaign ready to be published (draft → open)?
 * Currently this only checks the status; full validation happens in the
 * server action where the loaded row is available (title/description are
 * already required via DB check constraints).
 */
export function canPublish(status: CampaignStatus): boolean {
	return status === 'draft'
}

/**
 * Should the campaign auto-complete based on the set of booking statuses
 * that belong to accepted applications? A campaign completes when at
 * least one booking exists and all non-cancelled bookings are completed.
 */
export function shouldAutoComplete(
	bookingStatuses: readonly string[],
): boolean {
	if (bookingStatuses.length === 0) {
		return false
	}
	const nonCancelled = bookingStatuses.filter(
		(status) => status !== 'cancelled' && status !== 'declined',
	)
	if (nonCancelled.length === 0) {
		return false
	}
	return nonCancelled.every((status) => status === 'completed')
}
