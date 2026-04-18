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

const navItems = [
	{
		labelKey: 'overview' as const,
		href: '/admin',
		icon: (
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
		),
	},
	{
		labelKey: 'analytics' as const,
		href: '/admin/analytics',
		icon: (
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
					d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
				/>
			</svg>
		),
	},
	{
		labelKey: 'users' as const,
		href: '/admin/users',
		icon: (
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
					d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
				/>
			</svg>
		),
	},
	{
		labelKey: 'creators' as const,
		href: '/admin/creators',
		icon: (
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
					d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
				/>
			</svg>
		),
	},
	{
		labelKey: 'platformSettings' as const,
		href: '/admin/settings',
		icon: (
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
		),
	},
	{
		labelKey: 'payments' as const,
		href: '/admin/payments',
		icon: (
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
					d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
				/>
			</svg>
		),
	},
	{
		labelKey: 'disputes' as const,
		href: '/admin/disputes',
		icon: (
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
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
				/>
			</svg>
		),
	},
	{
		labelKey: 'moderation' as const,
		href: '/admin/reports',
		icon: (
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
					d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
				/>
			</svg>
		),
	},
	{
		labelKey: 'contentManagement' as const,
		href: '/admin/content',
		icon: (
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
					d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M6 6h.008v.008H6V6Z"
				/>
			</svg>
		),
	},
]

interface AdminSidebarProps {
	userName: string
	userEmail: string
}

const LG_BREAKPOINT = '(min-width: 1024px)'
const subscribe = (cb: () => void) => {
	const mql = window.matchMedia(LG_BREAKPOINT)
	mql.addEventListener('change', cb)
	return () => mql.removeEventListener('change', cb)
}
const getIsDesktop = () => window.matchMedia(LG_BREAKPOINT).matches
const getIsDesktopServer = () => false

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
	const t = useTranslations('admin')
	const pathname = usePathname()
	const [isMobileOpen, setIsMobileOpen] = useState(false)
	const toggleRef = useRef<HTMLButtonElement>(null)
	const sidebarRef = useRef<HTMLElement>(null)
	const isDesktop = useSyncExternalStore(
		subscribe,
		getIsDesktop,
		getIsDesktopServer,
	)

	function isActive(href: string) {
		if (href === '/admin') return pathname === '/admin'
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
				aria-controls="admin-sidebar"
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
				id="admin-sidebar"
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
					<span className="rounded-full bg-secondary-container px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-on-secondary-container">
						Admin
					</span>
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
								{t(item.labelKey)}
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
