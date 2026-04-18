'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'

interface NavbarLabels {
	creators: string
	campaigns: string
	howItWorks: string
	forCreators: string
	forBusinesses: string
	pricing: string
	openMenu: string
	closeMenu: string
	login: string
	getStarted: string
	backToHome: string
	themeLight: string
	themeDark: string
	themeSystem: string
	mainNavigation: string
}

const NAV_LINKS = [
	{ href: '/creators', labelKey: 'creators' as const },
	{ href: '/campaigns', labelKey: 'campaigns' as const },
	{ href: '/for-creators', labelKey: 'forCreators' as const },
	{ href: '/for-businesses', labelKey: 'forBusinesses' as const },
	{ href: '/how-it-works', labelKey: 'howItWorks' as const },
	{ href: '/pricing', labelKey: 'pricing' as const },
]

export function NavbarClient({ labels }: { labels: NavbarLabels }) {
	const [scrolled, setScrolled] = useState(false)
	const [open, setOpen] = useState(false)
	const drawerRef = useRef<HTMLDivElement>(null)
	const toggleRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		function handleScroll() {
			setScrolled(window.scrollY > 20)
		}
		handleScroll()
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const closeDrawer = useCallback(() => {
		setOpen(false)
		toggleRef.current?.focus()
	}, [])

	useEffect(() => {
		if (!open) return

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') closeDrawer()
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [open, closeDrawer])

	useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [open])

	return (
		<header>
			<nav
				className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter] duration-300 ${
					scrolled
						? 'bg-surface-container-high/80 backdrop-blur-[24px]'
						: 'bg-transparent'
				}`}
				aria-label={labels.mainNavigation}
			>
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
					<Link href="/" className="flex items-center">
						<Image
							src="/sprace-logo.png"
							alt={labels.backToHome}
							width={120}
							height={40}
							className="h-11 w-auto object-contain"
							priority
							sizes="120px"
						/>
					</Link>

					<div className="hidden items-center gap-8 font-sans text-sm text-foreground/60 lg:flex">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="rounded-sm transition-opacity duration-200 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
							>
								{labels[link.labelKey]}
							</Link>
						))}
					</div>

					<div className="flex items-center gap-3">
						<ThemeToggle
							lightLabel={labels.themeLight}
							darkLabel={labels.themeDark}
							systemLabel={labels.themeSystem}
							className="hidden sm:inline-flex"
						/>
						<div className="hidden sm:flex sm:items-center sm:gap-3">
							<Button asChild variant="secondary" size="sm">
								<Link href="/login">{labels.login}</Link>
							</Button>
							<Button asChild size="sm">
								<Link href="/register">{labels.getStarted}</Link>
							</Button>
						</div>

						<Button
							ref={toggleRef}
							type="button"
							variant="ghost"
							size="icon"
							className="lg:hidden"
							aria-expanded={open}
							aria-label={open ? labels.closeMenu : labels.openMenu}
							onClick={() => setOpen((v) => !v)}
						>
							<svg
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
								aria-hidden="true"
							>
								{open ? (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 18L18 6M6 6l12 12"
									/>
								) : (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
									/>
								)}
							</svg>
						</Button>
					</div>
				</div>
			</nav>

			{/* Mobile drawer overlay */}
			{open && (
				<div
					className="fixed inset-0 z-40 bg-foreground/60 lg:hidden"
					onClick={closeDrawer}
					aria-hidden="true"
				/>
			)}

			{/* Mobile drawer */}
			<div
				ref={drawerRef}
				className={`fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-surface-container-high transition-transform duration-300 lg:hidden ${
					open ? 'translate-x-0' : 'translate-x-full'
				}`}
				role="dialog"
				aria-modal="true"
				aria-label={labels.openMenu}
				{...(open
					? {}
					: ({ inert: true } as React.HTMLAttributes<HTMLDivElement>))}
			>
				<div className="flex h-16 items-center justify-end px-6">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label={labels.closeMenu}
						onClick={closeDrawer}
					>
						<svg
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</Button>
				</div>

				<div className="flex flex-1 flex-col gap-2 px-6">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="rounded-lg px-3 py-3 font-sans text-base text-foreground/70 duration-200 hover:bg-surface-container-highest hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
							onClick={closeDrawer}
						>
							{labels[link.labelKey]}
						</Link>
					))}
				</div>

				<div className="flex flex-col gap-3 border-t border-outline-variant/20 p-6">
					<div className="mb-2 flex justify-center">
						<ThemeToggle
							lightLabel={labels.themeLight}
							darkLabel={labels.themeDark}
							systemLabel={labels.themeSystem}
						/>
					</div>
					<Button asChild variant="secondary" className="w-full">
						<Link href="/login" onClick={closeDrawer}>
							{labels.login}
						</Link>
					</Button>
					<Button asChild className="w-full">
						<Link href="/register" onClick={closeDrawer}>
							{labels.getStarted}
						</Link>
					</Button>
				</div>
			</div>
		</header>
	)
}
