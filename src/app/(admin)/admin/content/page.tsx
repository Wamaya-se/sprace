import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ContentTabs } from './components/content-tabs'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('adminContentTitle'),
	}
}

export default async function AdminContentPage() {
	const t = await getTranslations('admin')
	const supabase = await createClient()

	const [
		{ data: specialties },
		{ data: markets },
		{ data: specialtyCounts },
		{ data: marketCounts },
	] = await Promise.all([
		supabase
			.from('specialties')
			.select('id, name, slug, created_at')
			.order('name'),
		supabase
			.from('markets')
			.select('id, name, slug, code, flag_emoji, sort_order, created_at')
			.order('sort_order')
			.order('name'),
		supabase.from('creator_specialties').select('specialty_id'),
		supabase.from('creator_markets').select('market_id'),
	])

	const specCountMap = new Map<string, number>()
	for (const row of specialtyCounts ?? []) {
		specCountMap.set(
			row.specialty_id,
			(specCountMap.get(row.specialty_id) ?? 0) + 1,
		)
	}

	const marketCountMap = new Map<string, number>()
	for (const row of marketCounts ?? []) {
		marketCountMap.set(
			row.market_id,
			(marketCountMap.get(row.market_id) ?? 0) + 1,
		)
	}

	const specialtiesWithCount = (specialties ?? []).map((s) => ({
		...s,
		creatorCount: specCountMap.get(s.id) ?? 0,
	}))

	const marketsWithCount = (markets ?? []).map((m) => ({
		...m,
		flagEmoji: m.flag_emoji,
		sortOrder: m.sort_order,
		creatorCount: marketCountMap.get(m.id) ?? 0,
	}))

	return (
		<div className="mx-auto max-w-4xl">
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('contentDescription')}
			</p>

			<ContentTabs
				specialties={specialtiesWithCount}
				markets={marketsWithCount}
			/>
		</div>
	)
}
