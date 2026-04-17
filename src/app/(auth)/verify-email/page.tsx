import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ResendVerification } from './resend-verification'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('verifyEmailTitle'),
	}
}

interface PageProps {
	searchParams: Promise<{ email?: string }>
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
	const params = await searchParams
	const t = await getTranslations('auth')
	const tc = await getTranslations('common')

	return (
		<div className="flex w-full flex-col items-center justify-center bg-surface-container-low px-6">
			<div className="w-full max-w-sm text-center">
				<div className="mb-8 flex justify-center">
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

				<div className="flex justify-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
						<svg
							className="h-8 w-8 text-brand"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
				</div>

				<h1 className="mt-6 font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
					{t('checkEmail')}
				</h1>
				<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
					{t('checkEmailDescription')}
				</p>

				{params.email && (
					<div className="mt-6">
						<ResendVerification email={params.email} />
					</div>
				)}

				<div className="mt-8">
					<Link
						href="/login"
						className="rounded-sm font-sans text-sm font-medium text-brand transition-opacity duration-200 hover:text-brand-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
					>
						{t('backToLogin')}
					</Link>
				</div>
			</div>
		</div>
	)
}
