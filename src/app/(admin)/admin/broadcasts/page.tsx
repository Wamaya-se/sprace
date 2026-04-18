import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { listBroadcasts } from '@/lib/queries/broadcasts'
import { BroadcastComposer } from './broadcast-composer'
import { BroadcastRowActions } from './broadcast-row-actions'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('broadcastsAdminTitle') }
}

export default async function AdminBroadcastsPage() {
	const t = await getTranslations('broadcasts')
	const broadcasts = await listBroadcasts()

	const audienceKeys = {
		all: 'audienceAll',
		creators: 'audienceCreators',
		businesses: 'audienceBusinesses',
	} as const

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-8">
			<p className="font-sans text-base leading-[1.7] text-muted-foreground">
				{t('description')}
			</p>

			<section aria-labelledby="broadcast-compose-heading">
				<h2
					id="broadcast-compose-heading"
					className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground"
				>
					{t('composeHeading')}
				</h2>
				<div className="mt-4 rounded-xl bg-surface-container p-5">
					<BroadcastComposer />
				</div>
			</section>

			<section aria-labelledby="broadcast-history-heading">
				<h2
					id="broadcast-history-heading"
					className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground"
				>
					{t('historyHeading')}
				</h2>

				{broadcasts.length === 0 ? (
					<div className="mt-4 rounded-xl bg-surface-container p-10 text-center">
						<p className="font-sans text-sm text-muted-foreground">
							{t('empty')}
						</p>
					</div>
				) : (
					<ul className="mt-4 flex flex-col gap-3">
						{broadcasts.map((b) => (
							<li key={b.id} className="rounded-xl bg-surface-container p-5">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
												{b.title}
											</h3>
											<Badge
												variant={b.status === 'sent' ? 'secondary' : 'outline'}
											>
												{t(
													b.status === 'sent'
														? 'statusSent'
														: ('statusDraft' as const),
												)}
											</Badge>
											<Badge variant="outline">
												{t(audienceKeys[b.audience])}
											</Badge>
										</div>
										<p className="mt-2 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
											{b.body}
										</p>
										{b.link && (
											<p className="mt-2 font-sans text-xs text-muted-foreground">
												{t('linkLabel')}:{' '}
												<span className="break-all text-foreground/80">
													{b.link}
												</span>
											</p>
										)}
										<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-muted-foreground">
											<span>
												{t('authorLabel')}:{' '}
												{b.author?.full_name ?? b.author?.email ?? '—'}
											</span>
											<span>
												{t('createdLabel')}:{' '}
												{new Date(b.created_at).toLocaleString(undefined, {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})}
											</span>
											{b.sent_at && (
												<span>
													{t('sentLabel')}:{' '}
													{new Date(b.sent_at).toLocaleString(undefined, {
														month: 'short',
														day: 'numeric',
														year: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													})}
												</span>
											)}
											{b.status === 'sent' && (
												<span>
													{t('recipientsLabel')}: {b.recipients_count}
												</span>
											)}
										</div>
									</div>

									<BroadcastRowActions broadcastId={b.id} status={b.status} />
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	)
}
