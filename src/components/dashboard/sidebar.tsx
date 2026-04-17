'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useSyncExternalStore,
} from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useRealtimeUnreadMessages } from '@/hooks/use-realtime-unread-messages'

interface NavItem {
	labelKey: string
	href: string
	icon: React.ReactNode
}

const overviewIcon = (
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
			d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
		/>
	</svg>
)

const profileIcon = (
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
			d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
		/>
	</svg>
)

const servicesIcon = (
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
			d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
		/>
	</svg>
)

const settingsIcon = (
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
			d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
		/>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
		/>
	</svg>
)

const discoverIcon = (
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
			d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
		/>
	</svg>
)

const savedIcon = (
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
			d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
		/>
	</svg>
)

const campaignsIcon = (
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
			d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
		/>
	</svg>
)

const messagesIcon = (
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
			d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
		/>
	</svg>
)

const bookingsIcon = (
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
			d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
		/>
	</svg>
)

const companyProfileIcon = (
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
			d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
		/>
	</svg>
)

const creatorNavItems: NavItem[] = [
	{ labelKey: 'overview', href: '/dashboard', icon: overviewIcon },
	{ labelKey: 'bookings', href: '/dashboard/bookings', icon: bookingsIcon },
	{ labelKey: 'messages', href: '/dashboard/messages', icon: messagesIcon },
	{ labelKey: 'profile', href: '/dashboard/profile', icon: profileIcon },
	{ labelKey: 'services', href: '/dashboard/services', icon: servicesIcon },
	{ labelKey: 'settings', href: '/dashboard/settings', icon: settingsIcon },
]

const businessNavItems: NavItem[] = [
	{ labelKey: 'overview', href: '/dashboard', icon: overviewIcon },
	{ labelKey: 'discover', href: '/dashboard/discover', icon: discoverIcon },
	{ labelKey: 'saved', href: '/dashboard/saved', icon: savedIcon },
	{ labelKey: 'bookings', href: '/dashboard/bookings', icon: bookingsIcon },
	{ labelKey: 'messages', href: '/dashboard/messages', icon: messagesIcon },
	{ labelKey: 'campaigns', href: '/dashboard/campaigns', icon: campaignsIcon },
	{
		labelKey: 'companyProfile',
		href: '/dashboard/profile',
		icon: companyProfileIcon,
	},
	{ labelKey: 'settings', href: '/dashboard/settings', icon: settingsIcon },
]

function getNavItems(role: 'creator' | 'business'): NavItem[] {
	return role === 'business' ? businessNavItems : creatorNavItems
}

interface SidebarProps {
	userName: string
	userEmail: string
	userId: string
	userRole: 'creator' | 'business'
	unreadMessageCount?: number
}

const LG_BREAKPOINT = '(min-width: 1024px)'
const subscribe = (cb: () => void) => {
	const mql = window.matchMedia(LG_BREAKPOINT)
	mql.addEventListener('change', cb)
	return () => mql.removeEventListener('change', cb)
}
const getIsDesktop = () => window.matchMedia(LG_BREAKPOINT).matches
const getIsDesktopServer = () => false

export function Sidebar({
	userName,
	userEmail,
	userId,
	userRole,
	unreadMessageCount = 0,
}: SidebarProps) {
	const t = useTranslations('dashboard')
	const pathname = usePathname()
	const [isMobileOpen, setIsMobileOpen] = useState(false)
	const toggleRef = useRef<HTMLButtonElement>(null)
	const sidebarRef = useRef<HTMLElement>(null)
	const isDesktop = useSyncExternalStore(
		subscribe,
		getIsDesktop,
		getIsDesktopServer,
	)
	const liveUnreadMessages = useRealtimeUnreadMessages({
		userId,
		initialCount: unreadMessageCount,
	})

	const navItems = getNavItems(userRole)

	function isActive(href: string) {
		if (href === '/dashboard') return pathname === '/dashboard'
		return pathname.startsWith(href)
	}

	const closeSidebar = useCallback(() => {
		setIsMobileOpen(false)
		toggleRef.current?.focus()
	}, [])

	useEffect(() => {
		if (!isMobileOpen) return
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') closeSidebar()
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [isMobileOpen, closeSidebar])

	const initial =
		userName?.charAt(0)?.toUpperCase() ||
		userEmail?.charAt(0)?.toUpperCase() ||
		'?'

	return (
		<>
			{/* Mobile toggle */}
			<Button
				ref={toggleRef}
				variant="ghost"
				size="icon-sm"
				onClick={() => setIsMobileOpen(true)}
				className="fixed top-4 left-4 z-50 lg:hidden"
				aria-label={t('openMenu')}
				aria-expanded={isMobileOpen}
				aria-controls="dashboard-sidebar"
			>
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
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
					/>
				</svg>
			</Button>

			{/* Mobile overlay */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-foreground/60 lg:hidden"
					onClick={closeSidebar}
					aria-hidden="true"
				/>
			)}

			{/* Sidebar */}
			<aside
				ref={sidebarRef}
				id="dashboard-sidebar"
				inert={!isDesktop && !isMobileOpen ? true : undefined}
				className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface-container-low transition-transform duration-200 lg:static lg:translate-x-0 ${
					isMobileOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				{/* Logo */}
				<div className="flex h-16 items-center gap-2.5 px-6">
					<Image
						src="/sprace-logo.png"
						alt="Sprace"
						width={140}
						height={120}
						className="h-9 w-auto"
					/>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={closeSidebar}
						className="ml-auto lg:hidden"
						aria-label={t('closeMenu')}
					>
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
								d="M6 18 18 6M6 6l12 12"
							/>
						</svg>
					</Button>
				</div>

				{/* Navigation */}
				<nav
					aria-label={t('dashboardNav')}
					className="mt-4 flex flex-1 flex-col gap-1 px-3"
				>
					{navItems.map((item) => {
						const active = isActive(item.href)
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setIsMobileOpen(false)}
								aria-current={active ? 'page' : undefined}
								className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm font-medium duration-150 ${
									active
										? 'bg-surface-container-high text-foreground'
										: 'text-muted-foreground hover:bg-surface-container/50 hover:text-foreground/80'
								}`}
							>
								<span
									className={active ? 'text-brand' : 'text-muted-foreground'}
								>
									{item.icon}
								</span>
								<span className="flex-1">{t(item.labelKey)}</span>
								{item.labelKey === 'messages' && liveUnreadMessages > 0 && (
									<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand/20 px-1.5 font-sans text-xs font-semibold text-brand">
										{liveUnreadMessages}
									</span>
								)}
							</Link>
						)
					})}
				</nav>

				{/* User section */}
				<Separator />
				<div className="p-4">
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarFallback>{initial}</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<p className="truncate font-sans text-sm font-medium text-foreground">
								{userName || ''}
							</p>
							<p className="truncate font-sans text-xs text-muted-foreground">
								{userEmail}
							</p>
						</div>
					</div>
				</div>
			</aside>
		</>
	)
}
