import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getApplicationDetail } from '@/lib/queries/campaigns'
import { getMessages } from '@/lib/queries/messages'
import { markAsRead } from '@/lib/actions/messages'
import { startApplicationConversation } from '@/lib/actions/campaigns'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageThread } from '@/components/dashboard/message-thread'
import {
	ApplicationStatusBadge,
	CampaignStatusBadge,
} from '@/components/campaigns/campaign-status-badge'
import { ApplicationActions } from '@/components/campaigns/application-actions'

interface PageProps {
	params: Promise<{ id: string; appId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('campaignsDashboardTitle') }
}

export default async function ApplicationDetailPage({ params }: PageProps) {
	const { id, appId } = await params

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/login')
	const role = (user.app_metadata?.role as string) ?? 'creator'
	if (role !== 'business' && role !== 'creator') {
		redirect('/dashboard')
	}

	const application = await getApplicationDetail(appId)
	if (!application || application.campaign.id !== id) {
		redirect(
			role === 'business'
				? `/dashboard/campaigns/${id}`
				: '/dashboard/campaigns',
		)
	}

	const isBusiness =
		role === 'business' && application.campaign.business.profile_id === user.id
	const isCreator =
		role === 'creator' && application.creator.profile_id === user.id
	if (!isBusiness && !isCreator) {
		redirect('/dashboard/campaigns')
	}

	const t = await getTranslations('campaigns')

	// Ensure there is an application conversation for active applications
	let conversationId: string | null = application.conversation_id
	const canChat = !['withdrawn', 'declined', 'accepted'].includes(
		application.status,
	)
	if (!conversationId && canChat) {
		const result = await startApplicationConversation(appId)
		if (result.success) {
			conversationId = result.data.conversationId
		}
	}

	const messages = conversationId
		? await (async () => {
				await markAsRead(conversationId!)
				return getMessages(conversationId!)
			})()
		: []

	const backHref = isBusiness
		? `/dashboard/campaigns/${id}?tab=applications`
		: '/dashboard/campaigns'

	const otherName = isBusiness
		? application.creator.display_name
		: application.campaign.business.company_name

	return (
		<div className="mx-auto max-w-5xl">
			<Link
				href={backHref}
				className="font-sans text-sm text-muted-foreground hover:text-foreground"
			>
				← {isBusiness ? t('backToCampaigns') : t('backToApplications')}
			</Link>

			<div className="mt-4 grid gap-5 md:grid-cols-[2fr_1fr]">
				<div className="flex flex-col gap-5">
					<Card>
						<CardContent className="py-5">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3">
									<Avatar className="size-12">
										{application.creator.avatar_url && (
											<AvatarImage
												src={application.creator.avatar_url}
												alt={application.creator.display_name}
											/>
										)}
										<AvatarFallback>
											{application.creator.display_name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<h2 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
											<Link
												href={
													application.creator.slug
														? `/creator/${application.creator.slug}`
														: '#'
												}
												className="hover:text-brand"
											>
												{application.creator.display_name}
											</Link>
										</h2>
										<p className="font-sans text-xs text-muted-foreground">
											{t('appliedOn', {
												date: new Date(
													application.created_at,
												).toLocaleDateString(undefined, {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
												}),
											})}
										</p>
									</div>
								</div>
								<ApplicationStatusBadge status={application.status} />
							</div>

							<div className="mt-5">
								<h3 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
									{t('pitchHeading')}
								</h3>
								<p className="mt-2 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/90">
									{application.pitch}
								</p>
							</div>

							{application.proposed_price && (
								<div className="mt-4">
									<h3 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
										{t('proposedPriceHeading')}
									</h3>
									<p className="mt-1 font-sans text-sm text-foreground/90">
										{t('budgetLabel', {
											amount: application.proposed_price.toLocaleString(),
										})}
									</p>
								</div>
							)}

							<div className="mt-5">
								<ApplicationActions
									applicationId={application.id}
									status={application.status}
									role={isBusiness ? 'business' : 'creator'}
									conversationId={conversationId}
									bookingId={application.booking_id}
								/>
							</div>
						</CardContent>
					</Card>

					{conversationId && (
						<Card className="overflow-hidden">
							<CardContent className="p-0">
								<MessageThread
									conversationId={conversationId}
									currentUserId={user.id}
									initialMessages={messages}
									otherParticipantName={otherName}
								/>
							</CardContent>
						</Card>
					)}
				</div>

				<aside className="flex flex-col gap-4">
					<Card>
						<CardContent className="py-5">
							<div className="flex items-center justify-between gap-2">
								<h3 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
									{application.campaign.title}
								</h3>
								<CampaignStatusBadge status={application.campaign.status} />
							</div>
							<p className="mt-1 font-sans text-xs text-muted-foreground">
								{t('companyLabel', {
									name: application.campaign.business.company_name,
								})}
							</p>
							<Link
								href={`/campaigns/${application.campaign.slug}`}
								className="mt-3 inline-block font-sans text-sm text-brand hover:underline"
							>
								{t('viewCampaign')}
							</Link>
						</CardContent>
					</Card>

					{application.booking_id && (
						<Card>
							<CardContent className="py-5">
								<Link
									href={`/dashboard/bookings/${application.booking_id}`}
									className="font-sans text-sm text-brand hover:underline"
								>
									{t('viewBooking')}
								</Link>
							</CardContent>
						</Card>
					)}
				</aside>
			</div>
		</div>
	)
}
