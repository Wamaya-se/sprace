const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Guards against PostgREST `.or()` filter injection when interpolating
 * values into the filter string. Throws on non-UUID input so callers fail
 * loudly instead of silently producing a broken or wide-open filter.
 */
export function assertUuid(value: string, label = 'id'): string {
	if (!UUID_RE.test(value)) {
		throw new Error(`Invalid UUID for ${label}: ${value}`)
	}
	return value
}

/**
 * Builds a safe PostgREST filter expression matching rows where
 * `participant_one` or `participant_two` equals the given user id.
 */
export function participantOrFilter(userId: string): string {
	const safe = assertUuid(userId, 'userId')
	return `participant_one.eq.${safe},participant_two.eq.${safe}`
}
