import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

export interface PublicLandingStats {
	activeCreators: number
	completedBookings: number
}

async function fetchStats(): Promise<PublicLandingStats> {
	const supabase = createPublicClient()
	const { data, error } = await supabase.rpc('public_landing_stats')

	if (error) {
		console.error('[getPublicLandingStats]', error)
		return { activeCreators: 0, completedBookings: 0 }
	}

	const row = data?.[0]
	if (!row) {
		return { activeCreators: 0, completedBookings: 0 }
	}

	return {
		activeCreators: Number(row.active_creators),
		completedBookings: Number(row.completed_bookings),
	}
}

export const getPublicLandingStats = unstable_cache(
	fetchStats,
	['public-landing-stats'],
	{ revalidate: 300, tags: ['landing-stats'] },
)
