import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('registerTitle'),
		description: t('registerDescription'),
	}
}

export default async function RegisterPage() {
	const t = await getTranslations('auth')
	const tc = await getTranslations('common')
	const brand = tc('sprace')
	const brandingParts = t('registerBrandingTitle', { brand }).split(brand)

	return (
		<>
			{/* Left panel — branding */}
			<div
				className="relative hidden w-1/2 overflow-hidden lg:block"
				aria-hidden="true"
			>
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />
				<div className="relative ml-auto flex h-full max-w-lg flex-col justify-between p-12">
					<Link href="/" tabIndex={-1}>
						<Image
							src="/sprace-logo.png"
							alt=""
							width={120}
							height={40}
							style={{ width: 120, height: 'auto' }}
							priority
						/>
					</Link>

					<div>
						<p className="max-w-md font-heading text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-foreground">
							{brandingParts.map((part, i) => (
								<Fragment key={i}>
									{part}
									{i < brandingParts.length - 1 ? (
										<span className="bg-gradient-to-r from-brand to-brand-container bg-clip-text text-transparent">
											{brand}
										</span>
									) : null}
								</Fragment>
							))}
						</p>
						<p className="mt-4 max-w-sm font-sans text-base leading-[1.7] text-muted-foreground">
							{t('registerBrandingSubtitle')}
						</p>
					</div>

					<p className="font-sans text-xs text-muted-foreground">
						&copy; {new Date().getFullYear()} {tc('sprace')}
					</p>
				</div>
			</div>

			{/* Right panel — role picker */}
			<div className="flex w-full flex-col items-center justify-center bg-surface-container-low px-6 lg:w-1/2 lg:items-start lg:pl-16 xl:pl-24">
				<div className="w-full max-w-sm">
					<div className="mb-8 lg:hidden">
						<Link href="/">
							<Image
								src="/sprace-logo.png"
								alt={tc('backToHome')}
								width={100}
								height={34}
								style={{ width: 100, height: 'auto' }}
								priority
							/>
						</Link>
					</div>

					<div className="mb-8">
						<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
							{t('chooseRole')}
						</h1>
						<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('chooseRoleSubtitle')}
						</p>
					</div>

					<div className="flex flex-col gap-4">
						<Link href="/register/creator" className="group block">
							<Card className="transition-transform duration-200 hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-tertiary/50">
								<CardContent className="flex items-start gap-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
										<svg
											className="h-5 w-5 text-brand"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={1.5}
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
											/>
										</svg>
									</div>
									<div className="flex flex-col gap-1">
										<span className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
											{t('creatorRole')}
										</span>
										<span className="font-sans text-sm leading-[1.7] text-muted-foreground">
											{t('creatorRoleDescription')}
										</span>
									</div>
								</CardContent>
							</Card>
						</Link>

						<Link href="/register/business" className="group block">
							<Card className="transition-transform duration-200 hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-tertiary/50">
								<CardContent className="flex items-start gap-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container/20">
										<svg
											className="h-5 w-5 text-on-secondary-container"
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
									</div>
									<div className="flex flex-col gap-1">
										<span className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
											{t('businessRole')}
										</span>
										<span className="font-sans text-sm leading-[1.7] text-muted-foreground">
											{t('businessRoleDescription')}
										</span>
									</div>
								</CardContent>
							</Card>
						</Link>
					</div>

					<div className="mt-8 text-center">
						<p className="font-sans text-sm text-muted-foreground">
							{t('hasAccount')}{' '}
							<Link
								href="/login"
								className="rounded-sm font-medium text-brand transition-opacity duration-200 hover:text-brand-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
							>
								{tc('login')}
							</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	)
}
