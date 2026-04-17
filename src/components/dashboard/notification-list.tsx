'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
	getNotifications,
	markNotificationRead,
	markAllNotificationsRead,
} from '@/lib/actions/notifications'
import type { NotificationItem } from '@/lib/actions/notifications'

interface NotificationListProps {
	initialNotifications: NotificationItem[]
	initialCursor: string | null
}

function formatRelativeTime(
	dateStr: string,
	labels: { now: string; minutes: string; hours: string; days: string },
) {
	const diff = Date.now() - new Date(dateStr).getTime()
	const minutes = Math.floor(diff / 60000)
	if (minutes < 1) return labels.now
	if (minutes < 60) return labels.minutes.replace('{count}', String(minutes))
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return labels.hours.replace('{count}', String(hours))
	const days = Math.floor(hours / 24)
	return labels.days.replace('{count}', String(days))
}

export function NotificationList({
	initialNotifications,
	initialCursor,
}: NotificationListProps) {
	const t = useTranslations('notifications')
	const [isPending, startTransition] = useTransition()
	const [isLoadingMore, startLoadMore] = useTransition()
	const router = useRouter()
	const [notifications, setNotifications] = useState(initialNotifications)
	const [cursor, setCursor] = useState(initialCursor)

	const hasUnread = notifications.some((n) => !n.read_at)

	const timeLabels = {
		now: t('justNow'),
		minutes: t('minutesAgo', { count: '{count}' }),
		hours: t('hoursAgo', { count: '{count}' }),
		days: t('daysAgo', { count: '{count}' }),
	}

	function handleMarkAllRead() {
		startTransition(async () => {
			await markAllNotificationsRead()
			router.refresh()
		})
	}

	function handleClick(notification: NotificationItem) {
		if (!notification.read_at) {
			startTransition(async () => {
				await markNotificationRead(notification.id)
			})
		}
	}

	function handleLoadMore() {
		if (!cursor) return
		startLoadMore(async () => {
			const { items, nextCursor } = await getNotifications(cursor)
			setNotifications((prev) => [...prev, ...items])
			setCursor(nextCursor)
		})
	}

	return (
		<div className="mt-6">
			{hasUnread && (
				<div className="mb-4 flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						disabled={isPending}
						onClick={handleMarkAllRead}
					>
						{isPending ? t('markingAllRead') : t('markAllRead')}
					</Button>
				</div>
			)}
			<div className="flex flex-col gap-1">
				{notifications.map((notification) => {
					const isUnread = !notification.read_at
					const content = (
						<div
							className={`flex gap-3 rounded-xl px-4 py-3 duration-150 ${
								isUnread
									? 'bg-surface-container-high'
									: 'hover:bg-surface-container/50'
							}`}
						>
							<div className="mt-0.5 flex h-2 w-2 shrink-0 items-center justify-center">
								{isUnread && <span className="h-2 w-2 rounded-full bg-brand" />}
							</div>
							<div className="min-w-0 flex-1">
								<p className="font-sans text-sm font-medium text-foreground">
									{notification.title}
								</p>
								<p className="mt-0.5 font-sans text-sm text-muted-foreground">
									{notification.body}
								</p>
								<p className="mt-1 font-sans text-xs text-muted-foreground">
									{formatRelativeTime(notification.created_at, timeLabels)}
								</p>
							</div>
						</div>
					)

					if (notification.link) {
						return (
							<Link
								key={notification.id}
								href={notification.link}
								onClick={() => handleClick(notification)}
							>
								{content}
							</Link>
						)
					}

					return <div key={notification.id}>{content}</div>
				})}
			</div>

			{cursor && (
				<div className="mt-4 flex justify-center">
					<Button
						variant="ghost"
						size="sm"
						disabled={isLoadingMore}
						onClick={handleLoadMore}
					>
						{isLoadingMore ? t('loadingMore') : t('loadMore')}
					</Button>
				</div>
			)}
		</div>
	)
}
