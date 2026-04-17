import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/scroll-reveal'

interface FaqItem {
	question: string
	answer: string
}

export async function FAQSection() {
	const t = await getTranslations('faq')

	const items: FaqItem[] = [
		{ question: t('q1'), answer: t('a1') },
		{ question: t('q2'), answer: t('a2') },
		{ question: t('q3'), answer: t('a3') },
		{ question: t('q4'), answer: t('a4') },
		{ question: t('q5'), answer: t('a5') },
		{ question: t('q6'), answer: t('a6') },
		{ question: t('q7'), answer: t('a7') },
	]

	return (
		<section className="bg-surface py-32" aria-labelledby="faq-heading">
			<div className="mx-auto max-w-3xl px-6">
				<ScrollReveal className="mb-16 text-center">
					<h2
						id="faq-heading"
						className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
					>
						{t('title')}
					</h2>
					<p className="mx-auto mt-4 max-w-xl font-sans text-base leading-[1.7] text-muted-foreground">
						{t('subtitle')}
					</p>
				</ScrollReveal>

				<ScrollReveal>
					<div className="divide-y divide-outline-variant/20">
						{items.map((item) => (
							<details key={item.question} className="group">
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
