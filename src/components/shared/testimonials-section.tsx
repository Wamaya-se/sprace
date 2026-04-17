import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export async function TestimonialsSection() {
	const t = await getTranslations('testimonials')

	const testimonials = [
		{
			quote: t('quote1'),
			author: t('author1'),
			role: t('role1'),
			initials: 'EL',
		},
		{
			quote: t('quote2'),
			author: t('author2'),
			role: t('role2'),
			initials: 'MK',
		},
		{
			quote: t('quote3'),
			author: t('author3'),
			role: t('role3'),
			initials: 'SR',
		},
	]

	return (
		<section
			className="bg-surface-container-low py-32"
			aria-labelledby="testimonials-heading"
		>
			<div className="mx-auto max-w-7xl px-6">
				<ScrollReveal className="mb-16 text-center">
					<h2
						id="testimonials-heading"
						className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
					>
						{t('title')}
					</h2>
					<p className="mx-auto mt-4 max-w-xl font-sans text-base leading-[1.7] text-muted-foreground">
						{t('subtitle')}
					</p>
				</ScrollReveal>

				<div className="grid gap-8 md:grid-cols-3">
					{testimonials.map((item, i) => (
						<ScrollReveal key={item.author} delay={i * 120}>
							<Card className="bg-surface-container p-8">
								<CardContent className="flex h-full flex-col p-0">
									<svg
										className="mb-4 h-8 w-8 text-brand/30"
										viewBox="0 0 24 24"
										fill="currentColor"
										aria-hidden="true"
									>
										<path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.29 0-2.23-.522-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.29 0-2.23-.522-2.917-1.179z" />
									</svg>

									<blockquote className="flex-1 font-sans text-sm leading-[1.7] text-foreground/60">
										{item.quote}
									</blockquote>

									<div className="mt-6 flex items-center gap-3">
										<Avatar size="sm">
											<AvatarFallback>{item.initials}</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
												{item.author}
											</p>
											<p className="font-sans text-xs text-muted-foreground">
												{item.role}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</ScrollReveal>
					))}
				</div>
			</div>
		</section>
	)
}
