import type { Metadata } from 'next'
import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from './login-form'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('loginTitle'),
		description: t('loginDescription'),
	}
}

interface PageProps {
	searchParams: Promise<{ reset?: string; deleted?: string }>
}

export default async function LoginPage({ searchParams }: PageProps) {
	const params = await searchParams
	const t = await getTranslations('auth')
	const tc = await getTranslations('common')
	const brand = tc('sprace')
	const loginBrandingParts = t('loginBrandingTitle', { brand }).split(brand)

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
							{loginBrandingParts.map((part, i) => (
								<Fragment key={i}>
									{part}
									{i < loginBrandingParts.length - 1 ? (
										<span className="bg-gradient-to-r from-brand to-brand-container bg-clip-text text-transparent">
											{brand}
										</span>
									) : null}
								</Fragment>
							))}
						</p>
						<p className="mt-4 max-w-sm font-sans text-base leading-[1.7] text-muted-foreground">
							{t('loginBrandingSubtitle')}
						</p>
					</div>

					<p className="font-sans text-xs text-muted-foreground">
						&copy; {new Date().getFullYear()} {tc('sprace')}
					</p>
				</div>
			</div>

			{/* Right panel — login form */}
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

					{params.reset === 'success' && (
						<div
							role="alert"
							className="mb-6 rounded-lg bg-brand/10 px-4 py-3 font-sans text-sm text-brand"
						>
							{t('passwordResetSuccess')}
						</div>
					)}

					{params.deleted === 'true' && (
						<div
							role="alert"
							className="mb-6 rounded-lg bg-surface-container p-4 font-sans text-sm text-muted-foreground"
						>
							{t('accountDeleted')}
						</div>
					)}

					<div className="mb-8">
						<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
							{t('loginTitle')}
						</h1>
						<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('loginSubtitle')}
						</p>
					</div>

					<LoginForm />

					<div className="mt-8 text-center">
						<p className="font-sans text-sm text-muted-foreground">
							{t('noAccount')}{' '}
							<Link
								href="/register"
								className="rounded-sm font-medium text-brand transition-opacity duration-200 hover:text-brand-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
							>
								{t('createAccount')}
							</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	)
}
