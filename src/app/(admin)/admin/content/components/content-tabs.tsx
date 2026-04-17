'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SpecialtiesList } from './specialties-list'
import { MarketsList } from './markets-list'

type Tab = 'specialties' | 'markets'

interface Specialty {
	id: string
	name: string
	slug: string
	created_at: string
	creatorCount: number
}

interface Market {
	id: string
	name: string
	slug: string
	code: string
	flagEmoji: string | null
	sortOrder: number
	created_at: string
	creatorCount: number
}

interface ContentTabsProps {
	specialties: Specialty[]
	markets: Market[]
}

export function ContentTabs({ specialties, markets }: ContentTabsProps) {
	const t = useTranslations('admin')
	const [activeTab, setActiveTab] = useState<Tab>('specialties')

	return (
		<div className="mt-6">
			<div
				className="flex gap-1 rounded-xl bg-surface-container p-1"
				role="tablist"
			>
				<button
					role="tab"
					id="tab-specialties"
					aria-selected={activeTab === 'specialties'}
					aria-controls="panel-specialties"
					tabIndex={activeTab === 'specialties' ? 0 : -1}
					onClick={() => setActiveTab('specialties')}
					className={`flex-1 rounded-lg px-4 py-2 font-sans text-sm font-medium duration-150 ${
						activeTab === 'specialties'
							? 'bg-surface-container-high text-foreground'
							: 'text-muted-foreground hover:text-foreground/80'
					}`}
				>
					{t('specialtiesTab')} ({specialties.length})
				</button>
				<button
					role="tab"
					id="tab-markets"
					aria-selected={activeTab === 'markets'}
					aria-controls="panel-markets"
					tabIndex={activeTab === 'markets' ? 0 : -1}
					onClick={() => setActiveTab('markets')}
					className={`flex-1 rounded-lg px-4 py-2 font-sans text-sm font-medium duration-150 ${
						activeTab === 'markets'
							? 'bg-surface-container-high text-foreground'
							: 'text-muted-foreground hover:text-foreground/80'
					}`}
				>
					{t('marketsTab')} ({markets.length})
				</button>
			</div>

			<div
				role="tabpanel"
				id={`panel-${activeTab}`}
				aria-labelledby={`tab-${activeTab}`}
				className="mt-6"
			>
				{activeTab === 'specialties' ? (
					<SpecialtiesList specialties={specialties} />
				) : (
					<MarketsList markets={markets} />
				)}
			</div>
		</div>
	)
}
