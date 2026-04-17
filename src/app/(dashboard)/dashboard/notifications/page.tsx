import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getNotifications } from '@/lib/queries/notifications'
import { NotificationList } from '@/components/dashboard/notification-list'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('notificationsTitle') }
}

export default async function NotificationsPage() {
	const t = await getTranslations('notifications')
	const { items, nextCursor } = await getNotifications()

	return (
		<div className="mx-auto max-w-2xl">
			<div className="flex items-center justify-between">
				<p className="font-sans text-base leading-[1.7] text-muted-foreground">
					{t('description')}
				</p>
			</div>

			{items.length === 0 ? (
				<div className="mt-12 text-center">
					<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
						{t('empty')}
					</h2>
					<p className="mt-2 font-sans text-sm text-muted-foreground">
						{t('emptyDescription')}
					</p>
				</div>
			) : (
				<NotificationList
					initialNotifications={items}
					initialCursor={nextCursor}
				/>
			)}
		</div>
	)
}
