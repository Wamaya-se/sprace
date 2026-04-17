import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getReports, type ReportStatus } from '@/lib/queries/reports'
import { ReportActions } from './report-actions'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('moderationAdminTitle') }
}

const statusVariants: Record<
	ReportStatus,
	'default' | 'secondary' | 'outline'
> = {
	pending: 'default',
	reviewing: 'default',
	resolved: 'secondary',
	dismissed: 'outline',
}

const statusKeys: Record<ReportStatus, string> = {
	pending: 'statusPending',
	reviewing: 'statusReviewing',
	resolved: 'statusResolved',
	dismissed: 'statusDismissed',
}

const categoryKeys = {
	spam: 'categorySpam',
	fraud: 'categoryFraud',
	harassment: 'categoryHarassment',
	inappropriate: 'categoryInappropriate',
	other: 'categoryOther',
} as const

const FILTERS: Array<{
	value: 'all' | ReportStatus
	labelKey:
		| 'filterAll'
		| 'filterPending'
		| 'filterReviewing'
		| 'filterResolved'
		| 'filterDismissed'
}> = [
	{ value: 'all', labelKey: 'filterAll' },
	{ value: 'pending', labelKey: 'filterPending' },
	{ value: 'reviewing', labelKey: 'filterReviewing' },
	{ value: 'resolved', labelKey: 'filterResolved' },
	{ value: 'dismissed', labelKey: 'filterDismissed' },
]

interface PageProps {
	searchParams: Promise<{ filter?: string }>
}

function isReportStatus(value: string | undefined): value is ReportStatus {
	return (
		value === 'pending' ||
		value === 'reviewing' ||
		value === 'resolved' ||
		value === 'dismissed'
	)
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const t = await getTranslations('moderation')
	const rawFilter = params.filter ?? 'all'
	const filter: ReportStatus | 'all' = isReportStatus(rawFilter)
		? rawFilter
		: 'all'

	const reports = await getReports(filter)

	return (
		<div className="mx-auto max-w-5xl">
			<p className="font-sans text-base leading-[1.7] text-muted-foreground">
				{t('description')}
			</p>

			<div className="mt-4 flex flex-wrap gap-2">
				{FILTERS.map((f) => (
					<Button
						key={f.value}
						variant={filter === f.value ? 'chip' : 'ghost'}
						size="sm"
						asChild
					>
						<Link
							href={
								f.value === 'all'
									? '/admin/reports'
									: `/admin/reports?filter=${f.value}`
							}
						>
							{t(f.labelKey)}
						</Link>
					</Button>
				))}
			</div>

			{reports.length === 0 ? (
				<div className="mt-12 text-center">
					<p className="font-sans text-sm text-muted-foreground">
						{t('noReports')}
					</p>
				</div>
			) : (
				<div className="mt-6 flex flex-col gap-4">
					{reports.map((report) => (
						<article
							key={report.id}
							className="rounded-xl bg-surface-container p-5"
						>
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="truncate font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
											{report.target_label}
										</h3>
										<Badge variant={statusVariants[report.status]}>
											{t(statusKeys[report.status] as never)}
										</Badge>
										<Badge variant="outline">
											{report.target_type === 'profile'
												? t('targetProfile')
												: t('targetBooking')}
										</Badge>
										<Badge variant="secondary">
											{t(categoryKeys[report.category] as never)}
										</Badge>
									</div>

									<div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 font-sans text-xs text-muted-foreground">
										<span>
											{t('reporterLabel')}: {report.reporter_name || '—'}
										</span>
										<span>
											{t('dateLabel')}:{' '}
											{new Date(report.created_at).toLocaleDateString(
												undefined,
												{ month: 'short', day: 'numeric', year: 'numeric' },
											)}
										</span>
									</div>
								</div>

								{report.target_link && (
									<Button variant="ghost" size="sm" asChild>
										<Link href={report.target_link}>{t('viewTarget')}</Link>
									</Button>
								)}
							</div>

							<div className="mt-3">
								<span className="font-sans text-xs font-medium text-muted-foreground">
									{t('reasonLabel')}
								</span>
								<p className="mt-0.5 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
									{report.reason}
								</p>
							</div>

							{report.admin_note && (
								<div className="mt-3 rounded-lg bg-surface-container-low p-3">
									<span className="font-sans text-xs font-medium text-muted-foreground">
										{t('adminNoteLabel')}
									</span>
									<p className="mt-0.5 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
										{report.admin_note}
									</p>
								</div>
							)}

							<ReportActions
								reportId={report.id}
								status={report.status}
								targetType={report.target_type}
								targetOwnerId={report.target_owner_id}
							/>
						</article>
					))}
				</div>
			)}
		</div>
	)
}
