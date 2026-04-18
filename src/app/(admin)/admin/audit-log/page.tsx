import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listAuditLog, type AuditActionValue } from '@/lib/queries/audit-log'
import { auditLogFiltersSchema, AUDIT_ACTIONS } from '@/lib/validation/admin'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('auditLogAdminTitle') }
}

const PAGE_SIZE = 50

function parseParams(raw: URLSearchParams) {
	const values = Object.fromEntries(raw.entries())
	const parsed = auditLogFiltersSchema.safeParse(values)
	if (!parsed.success) {
		return {
			action: undefined as AuditActionValue | undefined,
			actorId: undefined as string | undefined,
			limit: PAGE_SIZE,
			offset: 0,
		}
	}
	return parsed.data
}

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminAuditLogPage({ searchParams }: PageProps) {
	const raw = await searchParams
	const urlParams = new URLSearchParams()
	for (const [k, v] of Object.entries(raw)) {
		if (typeof v === 'string') urlParams.set(k, v)
	}
	const { action, actorId, limit, offset } = parseParams(urlParams)

	const t = await getTranslations('auditLog')
	const { items, total } = await listAuditLog({
		action,
		actorId,
		limit,
		offset,
	})

	const hasPrev = offset > 0
	const hasNext = offset + items.length < total

	function buildUrl(nextOffset: number) {
		const p = new URLSearchParams()
		if (action) p.set('action', action)
		if (actorId) p.set('actorId', actorId)
		p.set('offset', String(nextOffset))
		p.set('limit', String(limit))
		return `/admin/audit-log?${p.toString()}`
	}

	function buildFilterUrl(nextAction: AuditActionValue | 'all') {
		const p = new URLSearchParams()
		if (nextAction !== 'all') p.set('action', nextAction)
		if (actorId) p.set('actorId', actorId)
		return `/admin/audit-log${p.toString() ? '?' + p.toString() : ''}`
	}

	return (
		<div className="mx-auto max-w-6xl">
			<p className="font-sans text-base leading-[1.7] text-muted-foreground">
				{t('description')}
			</p>

			<div className="mt-4 flex flex-wrap gap-2">
				<Button
					variant={action === undefined ? 'chip' : 'ghost'}
					size="sm"
					asChild
				>
					<Link href={buildFilterUrl('all')}>{t('filterAll')}</Link>
				</Button>
				{AUDIT_ACTIONS.map((a) => (
					<Button
						key={a}
						variant={action === a ? 'chip' : 'ghost'}
						size="sm"
						asChild
					>
						<Link href={buildFilterUrl(a)}>{t(`action_${a}` as never)}</Link>
					</Button>
				))}
			</div>

			{items.length === 0 ? (
				<div className="mt-12 rounded-xl bg-surface-container p-10 text-center">
					<p className="font-sans text-sm text-muted-foreground">
						{t('empty')}
					</p>
				</div>
			) : (
				<>
					<div className="mt-6 overflow-hidden rounded-xl bg-surface-container">
						<table className="w-full text-left">
							<thead className="border-b border-outline-variant/20 bg-surface-container-high">
								<tr>
									<th className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{t('colWhen')}
									</th>
									<th className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{t('colActor')}
									</th>
									<th className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{t('colAction')}
									</th>
									<th className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{t('colTarget')}
									</th>
									<th className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{t('colMetadata')}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-outline-variant/10">
								{items.map((entry) => (
									<tr key={entry.id} className="align-top">
										<td className="px-4 py-3 font-sans text-xs text-muted-foreground">
											<time dateTime={entry.created_at}>
												{new Date(entry.created_at).toLocaleString(undefined, {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})}
											</time>
										</td>
										<td className="px-4 py-3 font-sans text-sm text-foreground">
											{entry.actor ? (
												<div className="flex flex-col">
													<span className="font-medium">
														{entry.actor.full_name ??
															entry.actor.email ??
															t('unknownActor')}
													</span>
													{entry.actor.full_name && entry.actor.email && (
														<span className="text-xs text-muted-foreground">
															{entry.actor.email}
														</span>
													)}
												</div>
											) : (
												<span className="text-muted-foreground">
													{t('systemActor')}
												</span>
											)}
										</td>
										<td className="px-4 py-3">
											<Badge variant="outline">
												{t(`action_${entry.action}` as never)}
											</Badge>
										</td>
										<td className="px-4 py-3 font-sans text-xs text-muted-foreground">
											{entry.target_type && entry.target_id ? (
												<div className="flex flex-col">
													<span className="font-medium text-foreground">
														{entry.target_type}
													</span>
													<code className="font-mono text-[11px] opacity-80">
														{entry.target_id}
													</code>
												</div>
											) : (
												<span>—</span>
											)}
										</td>
										<td className="px-4 py-3">
											<details className="font-sans text-xs text-muted-foreground">
												<summary className="cursor-pointer select-none font-medium text-foreground/80 hover:text-foreground">
													{t('viewDetails')}
												</summary>
												<pre className="mt-2 max-h-48 overflow-auto rounded-md bg-surface-container-low p-2 text-[11px] leading-relaxed">
													{JSON.stringify(entry.metadata, null, 2)}
												</pre>
											</details>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="mt-4 flex items-center justify-between font-sans text-sm text-muted-foreground">
						<span>
							{t('paginationStatus', {
								from: offset + 1,
								to: offset + items.length,
								total,
							})}
						</span>
						<div className="flex gap-2">
							<Button variant="ghost" size="sm" disabled={!hasPrev} asChild>
								<Link
									href={buildUrl(Math.max(0, offset - limit))}
									aria-disabled={!hasPrev}
								>
									{t('prev')}
								</Link>
							</Button>
							<Button variant="ghost" size="sm" disabled={!hasNext} asChild>
								<Link href={buildUrl(offset + limit)} aria-disabled={!hasNext}>
									{t('next')}
								</Link>
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	)
}
