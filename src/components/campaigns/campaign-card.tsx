import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CampaignStatusBadge } from './campaign-status-badge'
import type { PublicCampaignListItem } from '@/lib/queries/campaigns'

interface CampaignCardProps {
	campaign: PublicCampaignListItem & {
		application_count?: number
	}
	href: string
}

export function CampaignCard({ campaign, href }: CampaignCardProps) {
	const t = useTranslations('campaigns')
	return (
		<Link href={href} className="group block">
			<Card className="h-full duration-150 hover:bg-surface-container-high">
				<CardContent className="flex h-full flex-col gap-3 py-5">
					<div className="flex items-start justify-between gap-3">
						<h2 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground group-hover:text-brand">
							{campaign.title}
						</h2>
						<CampaignStatusBadge status={campaign.status} />
					</div>

					<p className="font-sans text-sm leading-[1.6] text-muted-foreground">
						{t('companyLabel', { name: campaign.company_name })}
					</p>

					<p className="line-clamp-3 font-sans text-sm leading-[1.6] text-foreground/80">
						{campaign.description}
					</p>

					<div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
						{campaign.specialties.slice(0, 3).map((s) => (
							<Badge key={s.id} variant="outline">
								{s.name}
							</Badge>
						))}
						{campaign.markets.slice(0, 2).map((m) => (
							<Badge key={m.id} variant="outline">
								{m.flag_emoji ? `${m.flag_emoji} ` : ''}
								{m.name}
							</Badge>
						))}
					</div>

					<div className="flex items-center justify-between pt-1 font-sans text-xs text-muted-foreground">
						<span>
							{campaign.budget_per_creator
								? t('budgetLabel', {
										amount: campaign.budget_per_creator.toLocaleString(),
									})
								: ''}
						</span>
						<span>
							{t('applicationsCount', {
								count: campaign.application_count ?? 0,
							})}
						</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	)
}
