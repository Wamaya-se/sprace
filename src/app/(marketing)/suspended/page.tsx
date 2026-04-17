import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LogoutButton } from '@/components/shared/logout-button'
import { getOptionalUser } from '@/lib/auth/guards'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('suspendedTitle') }
}

export default async function SuspendedPage() {
	const t = await getTranslations('suspendedAccount')
	const ctx = await getOptionalUser()

	let reason: string | null = null
	if (ctx) {
		const { data } = await ctx.supabase
			.from('profiles')
			.select('is_suspended, suspension_reason')
			.eq('id', ctx.user.id)
			.single()
		if (data?.is_suspended) {
			reason = data.suspension_reason
		}
	}

	return (
		<section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-24">
			<Card className="w-full">
				<CardContent className="py-8">
					<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground md:text-3xl">
						{t('title')}
					</h1>
					<p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground">
						{t('description')}
					</p>

					{reason && (
						<div className="mt-6 rounded-xl bg-surface-container-low p-4">
							<span className="font-sans text-xs font-medium text-muted-foreground">
								{t('reasonLabel')}
							</span>
							<p className="mt-0.5 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
								{reason}
							</p>
						</div>
					)}

					<div className="mt-8 flex flex-wrap gap-3">
						<Button asChild>
							<Link href="/contact">{t('contactSupport')}</Link>
						</Button>
						<LogoutButton label={t('logOut')} />
					</div>
				</CardContent>
			</Card>
		</section>
	)
}
