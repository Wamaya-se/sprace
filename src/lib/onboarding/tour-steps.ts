/**
 * Pure (unit-testable) tour-step definitions per role. Kept free
 * of React and Next.js imports so the same module can drive both
 * the client component and the test suite.
 *
 * Each step is anchored to a DOM element via a `data-tour="<id>"`
 * attribute on the actual target (sidebar nav item, banner, etc.).
 * Steps with `placement: 'center'` ignore `target` and render a
 * centered modal — used for the welcome + wrap-up screens.
 */

export type TourRole = 'creator' | 'business' | 'admin'

export type TourPlacement = 'top' | 'right' | 'bottom' | 'left' | 'center'

export interface TourStep {
	/** Stable id, used as React key and for analytics/telemetry. */
	id: string
	/** CSS-attr selector target (e.g. `nav-profile`). Empty for center steps. */
	target: string
	/** i18n key inside the `tour` namespace — heading of the step card. */
	titleKey: string
	/** i18n key inside the `tour` namespace — body text. */
	descriptionKey: string
	/** Preferred placement relative to the target. */
	placement: TourPlacement
}

const welcomeStep = (role: TourRole): TourStep => ({
	id: 'welcome',
	target: '',
	titleKey: `welcome.${role}.title`,
	descriptionKey: `welcome.${role}.description`,
	placement: 'center',
})

const finishedStep = (role: TourRole): TourStep => ({
	id: 'finished',
	target: '',
	titleKey: `finished.${role}.title`,
	descriptionKey: `finished.${role}.description`,
	placement: 'center',
})

const creatorSteps: TourStep[] = [
	welcomeStep('creator'),
	{
		id: 'nav-analytics',
		target: 'nav-analytics',
		titleKey: 'creator.analytics.title',
		descriptionKey: 'creator.analytics.description',
		placement: 'right',
	},
	{
		id: 'nav-bookings',
		target: 'nav-bookings',
		titleKey: 'creator.bookings.title',
		descriptionKey: 'creator.bookings.description',
		placement: 'right',
	},
	{
		id: 'nav-campaigns',
		target: 'nav-campaigns',
		titleKey: 'creator.campaigns.title',
		descriptionKey: 'creator.campaigns.description',
		placement: 'right',
	},
	{
		id: 'nav-messages',
		target: 'nav-messages',
		titleKey: 'creator.messages.title',
		descriptionKey: 'creator.messages.description',
		placement: 'right',
	},
	{
		id: 'nav-profile',
		target: 'nav-profile',
		titleKey: 'creator.profile.title',
		descriptionKey: 'creator.profile.description',
		placement: 'right',
	},
	{
		id: 'nav-services',
		target: 'nav-services',
		titleKey: 'creator.services.title',
		descriptionKey: 'creator.services.description',
		placement: 'right',
	},
	{
		id: 'nav-earnings',
		target: 'nav-earnings',
		titleKey: 'creator.earnings.title',
		descriptionKey: 'creator.earnings.description',
		placement: 'right',
	},
	finishedStep('creator'),
]

const businessSteps: TourStep[] = [
	welcomeStep('business'),
	{
		id: 'nav-discover',
		target: 'nav-discover',
		titleKey: 'business.discover.title',
		descriptionKey: 'business.discover.description',
		placement: 'right',
	},
	{
		id: 'nav-saved',
		target: 'nav-saved',
		titleKey: 'business.saved.title',
		descriptionKey: 'business.saved.description',
		placement: 'right',
	},
	{
		id: 'nav-bookings',
		target: 'nav-bookings',
		titleKey: 'business.bookings.title',
		descriptionKey: 'business.bookings.description',
		placement: 'right',
	},
	{
		id: 'nav-campaigns',
		target: 'nav-campaigns',
		titleKey: 'business.campaigns.title',
		descriptionKey: 'business.campaigns.description',
		placement: 'right',
	},
	{
		id: 'nav-messages',
		target: 'nav-messages',
		titleKey: 'business.messages.title',
		descriptionKey: 'business.messages.description',
		placement: 'right',
	},
	{
		id: 'nav-analytics',
		target: 'nav-analytics',
		titleKey: 'business.analytics.title',
		descriptionKey: 'business.analytics.description',
		placement: 'right',
	},
	{
		id: 'nav-profile',
		target: 'nav-profile',
		titleKey: 'business.profile.title',
		descriptionKey: 'business.profile.description',
		placement: 'right',
	},
	finishedStep('business'),
]

const adminSteps: TourStep[] = [
	welcomeStep('admin'),
	{
		id: 'nav-users',
		target: 'nav-users',
		titleKey: 'admin.users.title',
		descriptionKey: 'admin.users.description',
		placement: 'right',
	},
	{
		id: 'nav-creators',
		target: 'nav-creators',
		titleKey: 'admin.creators.title',
		descriptionKey: 'admin.creators.description',
		placement: 'right',
	},
	{
		id: 'nav-reports',
		target: 'nav-reports',
		titleKey: 'admin.reports.title',
		descriptionKey: 'admin.reports.description',
		placement: 'right',
	},
	{
		id: 'nav-disputes',
		target: 'nav-disputes',
		titleKey: 'admin.disputes.title',
		descriptionKey: 'admin.disputes.description',
		placement: 'right',
	},
	{
		id: 'nav-broadcasts',
		target: 'nav-broadcasts',
		titleKey: 'admin.broadcasts.title',
		descriptionKey: 'admin.broadcasts.description',
		placement: 'right',
	},
	{
		id: 'nav-audit-log',
		target: 'nav-audit-log',
		titleKey: 'admin.auditLog.title',
		descriptionKey: 'admin.auditLog.description',
		placement: 'right',
	},
	finishedStep('admin'),
]

/**
 * Returns a stable, role-appropriate list of steps. The same array
 * reference is returned between calls, so React keys + identity
 * checks remain cheap.
 */
export function getTourSteps(role: TourRole): TourStep[] {
	switch (role) {
		case 'creator':
			return creatorSteps
		case 'business':
			return businessSteps
		case 'admin':
			return adminSteps
	}
}

/**
 * Clamp an index into the valid range [0, steps.length - 1]. Used
 * by the reducer-less step controller to keep forward/back clicks
 * from drifting off the ends.
 */
export function clampStepIndex(index: number, total: number): number {
	if (total <= 0) return 0
	if (index < 0) return 0
	if (index >= total) return total - 1
	return index
}
