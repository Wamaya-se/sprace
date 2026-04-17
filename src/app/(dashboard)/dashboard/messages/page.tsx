import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getConversations } from '@/lib/queries/messages'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RealtimeInbox } from '@/components/dashboard/realtime-inbox'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('messagesTitle'),
	}
}

function getInitial(name: string | null): string {
	if (!name) return '?'
	return name.charAt(0).toUpperCase()
}

type TimeLabels = {
	now: string
	minutes: (count: number) => string
	hours: (count: number) => string
	days: (count: number) => string
}

function formatRelativeTime(dateStr: string, labels: TimeLabels): string {
	const date = new Date(dateStr)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffMins < 1) return labels.now
	if (diffMins < 60) return labels.minutes(diffMins)
	if (diffHours < 24) return labels.hours(diffHours)
	if (diffDays < 7) return labels.days(diffDays)
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default async function MessagesPage() {
	const t = await getTranslations('messages')
	const td = await getTranslations('dashboard')

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const conversations = await getConversations()

	const timeLabels: TimeLabels = {
		now: t('timeNow'),
		minutes: (count: number) => t('timeMinutes', { count }),
		hours: (count: number) => t('timeHours', { count }),
		days: (count: number) => t('timeDays', { count }),
	}

	return (
		<div className="mx-auto max-w-3xl">
			<RealtimeInbox userId={user.id} />
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{td('messagesDescription')}
			</p>

			{conversations.length > 0 ? (
				<div className="mt-6 flex flex-col gap-2">
					{conversations.map((conv) => (
						<Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
							<Card className="duration-150 hover:bg-surface-container-high">
								<CardContent className="flex items-center gap-4 py-3">
									<Avatar>
										<AvatarFallback>
											{getInitial(conv.other_participant.full_name)}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<h2 className="truncate font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
												{conv.other_participant.full_name ?? t('unknownUser')}
											</h2>
											<span className="shrink-0 font-sans text-xs text-muted-foreground">
												{formatRelativeTime(conv.last_message_at, timeLabels)}
											</span>
										</div>
										<div className="mt-0.5 flex items-center justify-between gap-2">
											<p className="truncate font-sans text-xs text-muted-foreground">
												{conv.last_message
													? conv.last_message.is_system
														? `${t('systemMessage')}: ${conv.last_message.content}`
														: conv.last_message.content
													: t('noMessages')}
											</p>
											{conv.unread_count > 0 && (
												<Badge
													variant="default"
													className="shrink-0 px-1.5 py-0.5 text-xs"
												>
													{conv.unread_count}
												</Badge>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-surface-container py-20 text-center">
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('empty')}
					</h2>
					<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
						{t('emptyDescription')}
					</p>
				</div>
			)}
		</div>
	)
}
