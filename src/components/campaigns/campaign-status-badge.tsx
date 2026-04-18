import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/supabase'

type CampaignStatus = Database['public']['Enums']['campaign_status']

const statusToVariant: Record<
	CampaignStatus,
	'default' | 'secondary' | 'outline'
> = {
	draft: 'outline',
	open: 'default',
	closed: 'secondary',
	completed: 'secondary',
	cancelled: 'outline',
}

const statusToKey: Record<CampaignStatus, string> = {
	draft: 'statusDraft',
	open: 'statusOpen',
	closed: 'statusClosed',
	completed: 'statusCompleted',
	cancelled: 'statusCancelled',
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
	const t = useTranslations('campaigns')
	return (
		<Badge variant={statusToVariant[status]}>{t(statusToKey[status])}</Badge>
	)
}

type ApplicationStatus = Database['public']['Enums']['application_status']

const applicationVariants: Record<
	ApplicationStatus,
	'default' | 'secondary' | 'outline'
> = {
	pending: 'outline',
	shortlisted: 'default',
	accepted: 'secondary',
	declined: 'outline',
	withdrawn: 'outline',
}

const applicationKeys: Record<ApplicationStatus, string> = {
	pending: 'statusPending',
	shortlisted: 'statusShortlisted',
	accepted: 'statusAccepted',
	declined: 'statusDeclined',
	withdrawn: 'statusWithdrawn',
}

export function ApplicationStatusBadge({
	status,
}: {
	status: ApplicationStatus
}) {
	const t = useTranslations('campaigns')
	return (
		<Badge variant={applicationVariants[status]}>
			{t(applicationKeys[status])}
		</Badge>
	)
}
