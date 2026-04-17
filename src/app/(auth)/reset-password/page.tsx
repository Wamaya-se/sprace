import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ResetPasswordForm } from './reset-password-form'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('resetPasswordTitle'),
	}
}

export default async function ResetPasswordPage() {
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

				<div className="mb-8">
					<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
						{t('resetPasswordTitle')}
					</h1>
					<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
						{t('resetPasswordSubtitle')}
					</p>
				</div>

				<ResetPasswordForm />
			</div>
		</div>
	)
}
