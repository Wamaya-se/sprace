/**
 * Current onboarding tour version. Bump this string when tour
 * content changes substantively so every existing user is shown
 * the refreshed tour on next dashboard visit. Use a short, stable
 * label (semver-ish, e.g. `2026-04-21` or `v2`) — it is stored as
 * text in `profiles.tour_completed_version`.
 */
export const CURRENT_TOUR_VERSION = '2026-04-21'

/**
 * Returns true when the user has never finished a tour, or the
 * tour version has changed since they last saw it.
 */
export function shouldShowTour(
	completedVersion: string | null | undefined,
): boolean {
	if (!completedVersion) return true
	return completedVersion !== CURRENT_TOUR_VERSION
}
