import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCreatorEarnings } from '@/lib/queries/earnings'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('earnings')
	return { title: t('metaTitle') }
}

function formatAmount(minor: number, currency: string) {
	return `${(minor / 100).toLocaleString('sv-SE', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})} ${currency.toUpperCase()}`
}

function formatDate(iso: string | null) {
	return iso ? iso.slice(0, 10) : '—'
}

export default async function EarningsPage() {
	const t = await getTranslations('earnings')
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/login')
	if (user.app_metadata?.role !== 'creator') redirect('/dashboard')

	const payload = await getCreatorEarnings()
	const quarterly = payload?.quarterly ?? []
	const yearly = payload?.yearly ?? []
	const rows = payload?.rows ?? []

	const grandTotal = rows.reduce((sum, r) => sum + r.creatorPayoutMinor, 0)
	const currency = rows[0]?.currency ?? 'sek'

	return (
		<div className="mx-auto max-w-5xl">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="font-sans text-sm text-muted-foreground">
						{t('description')}
					</p>
				</div>
				<Button variant="outline" asChild>
					<a href="/api/earnings/csv" download>
						{t('downloadCsv')}
					</a>
				</Button>
			</div>

			<div className="mt-8 grid gap-4 sm:grid-cols-3">
				<Card>
					<CardContent>
						<p className="font-sans text-sm text-muted-foreground">
							{t('lifetimeTotal')}
						</p>
						<p className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-foreground">
							{formatAmount(grandTotal, currency)}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<p className="font-sans text-sm text-muted-foreground">
							{t('totalPayouts')}
						</p>
						<p className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-foreground">
							{rows.length}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<p className="font-sans text-sm text-muted-foreground">
							{t('latestPayout')}
						</p>
						<p className="mt-2 font-heading text-xl font-bold tracking-[-0.03em] text-foreground">
							{formatDate(rows[0]?.transferredAt ?? null)}
						</p>
					</CardContent>
				</Card>
			</div>

			<section className="mt-10">
				<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
					{t('byYear')}
				</h2>
				{yearly.length === 0 ? (
					<p className="mt-3 font-sans text-sm text-muted-foreground">
						{t('emptyState')}
					</p>
				) : (
					<div className="mt-3 space-y-2">
						{yearly.map((p) => (
							<Card key={p.period}>
								<CardContent className="flex items-center justify-between py-4">
									<div>
										<p className="font-sans text-sm font-medium text-foreground">
											{p.label}
										</p>
										<p className="font-sans text-xs text-muted-foreground">
											{t('bookingCount', { count: p.bookingCount })}
										</p>
									</div>
									<p className="font-sans text-base font-semibold text-foreground">
										{formatAmount(p.totalMinor, p.currency)}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>

			<section className="mt-8">
				<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
					{t('byQuarter')}
				</h2>
				{quarterly.length === 0 ? (
					<p className="mt-3 font-sans text-sm text-muted-foreground">
						{t('emptyState')}
					</p>
				) : (
					<div className="mt-3 space-y-2">
						{quarterly.map((p) => (
							<Card key={p.period}>
								<CardContent className="flex items-center justify-between py-4">
									<div>
										<p className="font-sans text-sm font-medium text-foreground">
											{p.label}
										</p>
										<p className="font-sans text-xs text-muted-foreground">
											{t('bookingCount', { count: p.bookingCount })}
										</p>
									</div>
									<p className="font-sans text-base font-semibold text-foreground">
										{formatAmount(p.totalMinor, p.currency)}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>
		</div>
	)
}
