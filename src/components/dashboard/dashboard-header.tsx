'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { logOut } from '@/app/(dashboard)/actions'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

const creatorTitleKeys: Record<string, string> = {
	'/dashboard': 'overview',
	'/dashboard/bookings': 'bookings',
	'/dashboard/messages': 'messages',
	'/dashboard/notifications': 'notifications',
	'/dashboard/reviews': 'reviews',
	'/dashboard/profile': 'profile',
	'/dashboard/services': 'services',
	'/dashboard/services/new': 'services',
	'/dashboard/earnings': 'earnings',
	'/dashboard/settings': 'settings',
}

const businessTitleKeys: Record<string, string> = {
	'/dashboard': 'overview',
	'/dashboard/discover': 'discover',
	'/dashboard/saved': 'saved',
	'/dashboard/bookings': 'bookings',
	'/dashboard/bookings/new': 'bookings',
	'/dashboard/messages': 'messages',
	'/dashboard/notifications': 'notifications',
	'/dashboard/reviews': 'reviews',
	'/dashboard/campaigns': 'campaigns',
	'/dashboard/profile': 'companyProfile',
	'/dashboard/spending': 'spending',
	'/dashboard/settings': 'settings',
}

interface DashboardHeaderProps {
	userRole: 'creator' | 'business'
	userId: string
	unreadNotifications?: number
}

export function DashboardHeader({
	userRole,
	userId,
	unreadNotifications = 0,
}: DashboardHeaderProps) {
	const pathname = usePathname()
	const t = useTranslations('dashboard')
	const tc = useTranslations('common')
	const liveUnreadCount = useRealtimeNotifications({
		userId,
		initialCount: unreadNotifications,
	})

	const titleMap =
		userRole === 'business' ? businessTitleKeys : creatorTitleKeys
	const titleKey =
		titleMap[pathname] ??
		(pathname.startsWith('/dashboard/services/')
			? 'services'
			: pathname.startsWith('/dashboard/discover/')
				? 'discover'
				: pathname.startsWith('/dashboard/bookings/')
					? 'bookings'
					: pathname.startsWith('/dashboard/messages/')
						? 'messages'
						: 'overview')
	const title = t(titleKey)

	return (
		<header className="flex h-16 items-center justify-between border-b border-outline-variant/10 pl-16 pr-6 lg:px-8">
			<h1 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground lg:text-2xl">
				{title}
			</h1>
			<div className="flex items-center gap-2">
				<ThemeToggle
					lightLabel={tc('themeLight')}
					darkLabel={tc('themeDark')}
					systemLabel={tc('themeSystem')}
				/>
				<Button variant="ghost" size="icon-sm" asChild>
					<Link href="/dashboard/notifications" aria-label={t('notifications')}>
						<span className="relative">
							<svg
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
								/>
							</svg>
							{liveUnreadCount > 0 && (
								<span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-on-brand">
									{liveUnreadCount > 99 ? '99+' : liveUnreadCount}
								</span>
							)}
						</span>
					</Link>
				</Button>
				<form action={logOut}>
					<Button type="submit" variant="ghost" size="sm">
						{tc('logOut')}
					</Button>
				</form>
			</div>
		</header>
	)
}
