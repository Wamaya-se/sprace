import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Separator } from '@/components/ui/separator'
import { NewsletterForm } from './newsletter-form'

export async function Footer() {
	const t = await getTranslations('footer')
	const tc = await getTranslations('common')

	const platformLinks = [
		{ href: '/creators', label: tc('creators') },
		{ href: '/register', label: t('forBusinesses') },
		{ href: '/register/creator', label: t('forCreators') },
	]

	const companyLinks = [
		{ href: '/about', label: t('aboutUs') },
		{ href: '/contact', label: t('contact') },
	]

	const legalLinks = [
		{ href: '/terms', label: t('termsOfService') },
		{ href: '/privacy', label: t('privacyPolicy') },
	]

	const linkClasses =
		'rounded-sm font-sans text-sm text-muted-foreground transition-opacity duration-200 hover:text-foreground/80 focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50'

	return (
		<footer className="bg-surface-container-low">
			<div className="mx-auto max-w-7xl px-6 pt-20 pb-10">
				<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
					{/* Brand + newsletter */}
					<div className="flex flex-col items-start gap-6 lg:col-span-1">
						<Image
							src="/sprace-logo.png"
							alt={tc('sprace')}
							width={120}
							height={40}
							className="h-12 w-auto object-contain"
							sizes="120px"
						/>
						<p className="max-w-xs font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('description')}
						</p>

						<div className="flex gap-4">
							<a
								href="https://instagram.com"
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-muted-foreground duration-200 hover:bg-surface-container-high hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
								aria-label={tc('socialInstagram')}
							>
								<svg
									className="h-4 w-4"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
								</svg>
							</a>
							<a
								href="https://tiktok.com"
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-muted-foreground duration-200 hover:bg-surface-container-high hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
								aria-label={tc('socialTikTok')}
							>
								<svg
									className="h-4 w-4"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.37a8.16 8.16 0 004.77 1.52V7.45a4.81 4.81 0 01-1-.76z" />
								</svg>
							</a>
							<a
								href="https://linkedin.com"
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-muted-foreground duration-200 hover:bg-surface-container-high hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
								aria-label={tc('socialLinkedIn')}
							>
								<svg
									className="h-4 w-4"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
								</svg>
							</a>
						</div>
					</div>

					{/* Platform links */}
					<div className="flex flex-col gap-3">
						<h2 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
							{t('platform')}
						</h2>
						{platformLinks.map((link) => (
							<Link key={link.href} href={link.href} className={linkClasses}>
								{link.label}
							</Link>
						))}
					</div>

					{/* Company + legal links */}
					<div className="flex flex-col gap-3">
						<h2 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
							{t('company')}
						</h2>
						{companyLinks.map((link) => (
							<Link key={link.href} href={link.href} className={linkClasses}>
								{link.label}
							</Link>
						))}

						<h2 className="mt-4 font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
							{t('legal')}
						</h2>
						{legalLinks.map((link) => (
							<Link key={link.href} href={link.href} className={linkClasses}>
								{link.label}
							</Link>
						))}
					</div>

					{/* Newsletter */}
					<div className="flex flex-col gap-3">
						<h2 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
							{t('newsletter')}
						</h2>
						<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('newsletterDisclaimer')}
						</p>
						<NewsletterForm
							placeholder={t('newsletterPlaceholder')}
							buttonLabel={t('newsletterButton')}
						/>
					</div>
				</div>

				<Separator className="mt-16 mb-8" />

				<p className="font-sans text-xs text-muted-foreground">
					&copy; {new Date().getFullYear()} {tc('sprace')}.{' '}
					{tc('allRightsReserved')}
				</p>
			</div>
		</footer>
	)
}
