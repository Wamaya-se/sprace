import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface PublicLandingStats {
	activeCreators: number
	completedBookings: number
}

async function fetchStats(): Promise<PublicLandingStats> {
	const supabase = await createClient()
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
