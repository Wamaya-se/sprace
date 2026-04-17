import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/scroll-reveal'

interface FaqItem {
	id?: string
	question: string
	answer: string
}

interface FAQSectionProps {
	/** Overrides the default "faq" namespace title. */
	heading?: string
	/** Overrides the default "faq" namespace subtitle. */
	subheading?: string
	/** Overrides the default landing-page FAQ entries. */
	items?: FaqItem[]
	/** Optional id for the heading — defaults to "faq-heading". */
	headingId?: string
}

export async function FAQSection({
	heading,
	subheading,
	items,
	headingId = 'faq-heading',
}: FAQSectionProps = {}) {
	const t = await getTranslations('faq')

	const hasCustomContent = heading !== undefined || items !== undefined
	const resolvedHeading = heading ?? t('title')
	const resolvedSubheading =
		subheading ?? (hasCustomContent ? undefined : t('subtitle'))
	const resolvedItems: FaqItem[] =
		items ??
		([1, 2, 3, 4, 5, 6, 7] as const).map((n) => ({
			question: t(`q${n}`),
			answer: t(`a${n}`),
		}))

	return (
		<section className="bg-surface py-32" aria-labelledby={headingId}>
			<div className="mx-auto max-w-3xl px-6">
				<ScrollReveal className="mb-16 text-center">
					<h2
						id={headingId}
						className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
					>
						{resolvedHeading}
					</h2>
					{resolvedSubheading && (
						<p className="mx-auto mt-4 max-w-xl font-sans text-base leading-[1.7] text-muted-foreground">
							{resolvedSubheading}
						</p>
					)}
				</ScrollReveal>

				<ScrollReveal>
					<div className="divide-y divide-outline-variant/20">
						{resolvedItems.map((item) => (
							<details key={item.id ?? item.question} className="group">
								<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 font-heading text-base font-semibold tracking-[-0.03em] text-foreground transition-opacity duration-200 hover:opacity-80 [&::-webkit-details-marker]:hidden">
									{item.question}
									<svg
										className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden="true"
									>
										<path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
									</svg>
								</summary>
								<div className="pb-6 font-sans text-sm leading-[1.7] text-foreground/60">
									{item.answer}
								</div>
							</details>
						))}
					</div>
				</ScrollReveal>
			</div>
		</section>
	)
}
