import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ForgotPasswordForm } from './forgot-password-form'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('forgotPasswordTitle'),
	}
}

export default async function ForgotPasswordPage() {
	const t = await getTranslations('auth')
	const tc = await getTranslations('common')

	return (
		<div className="flex w-full flex-col items-center justify-center bg-surface-container-low px-6">
			<div className="w-full max-w-sm">
				<div className="mb-8">
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

				<div className="mb-2">
					<Link
						href="/login"
						className="inline-flex items-center gap-1 rounded-sm font-sans text-sm text-muted-foreground transition-opacity duration-200 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.75 19.5L8.25 12l7.5-7.5"
							/>
						</svg>
						{t('backToLogin')}
					</Link>
				</div>

				<div className="mb-8">
					<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
						{t('forgotPasswordTitle')}
					</h1>
					<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
						{t('forgotPasswordSubtitle')}
					</p>
				</div>

				<ForgotPasswordForm />
			</div>
		</div>
	)
}
