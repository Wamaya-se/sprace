import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/shared/json-ld'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getAllBlogPosts } from '@/lib/blog/posts'
import { env } from '@/lib/env'
import { getOrganizationJsonLd } from '@/lib/seo/organization'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('blogTitle'),
		description: t('blogDescription'),
		openGraph: {
			title: t('blogTitle'),
			description: t('blogDescription'),
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: t('blogTitle'),
			description: t('blogDescription'),
		},
		alternates: { canonical: '/blog' },
	}
}

export default async function BlogIndexPage() {
	const t = await getTranslations('blog')
	const [posts, locale, organization] = await Promise.all([
		getAllBlogPosts(),
		getLocale(),
		getOrganizationJsonLd(),
	])
	const siteUrl = env.siteUrl

	const blogJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		'@id': `${siteUrl}/blog#blog`,
		url: `${siteUrl}/blog`,
		name: t('heroTitle'),
		description: t('heroSubtitle'),
		publisher: { '@id': `${siteUrl}/#organization` },
		blogPost: posts.map((p) => ({
			'@type': 'BlogPosting',
			headline: p.title,
			url: `${siteUrl}/blog/${p.slug}`,
			datePublished: p.date,
			author: { '@type': 'Person', name: p.author },
		})),
	}

	const dateFmt = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})

	return (
		<>
			<JsonLd data={organization} />
			<JsonLd data={blogJsonLd} />

			{/* Hero */}
			<section className="relative overflow-hidden pt-32 pb-16">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />

				<div className="relative mx-auto max-w-4xl px-6 text-center">
					<h1 className="hero-animate hero-animate-delay-1 font-heading text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-6xl">
						{t('heroTitle')}
					</h1>
					<p className="hero-animate hero-animate-delay-2 mx-auto mt-6 max-w-2xl font-sans text-lg leading-[1.7] text-foreground/60">
						{t('heroSubtitle')}
					</p>
				</div>
			</section>

			{/* Posts grid */}
			<section
				className="bg-surface-container-low py-20"
				aria-labelledby="blog-posts-heading"
			>
				<div className="mx-auto max-w-7xl px-6">
					<h2 id="blog-posts-heading" className="sr-only">
						{t('listHeadingSr')}
					</h2>

					{posts.length === 0 ? (
						<Card className="mx-auto max-w-lg bg-surface-container p-10 text-center">
							<CardContent className="p-0">
								<h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
									{t('emptyTitle')}
								</h3>
								<p className="mt-3 font-sans text-sm leading-[1.7] text-muted-foreground">
									{t('emptyBody')}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
							{posts.map((post, i) => (
								<ScrollReveal key={post.slug} delay={i * 80}>
									<Card className="group h-full overflow-hidden bg-surface-container transition-transform duration-200 hover:-translate-y-1">
										<Link
											href={`/blog/${post.slug}`}
											className="flex h-full flex-col focus-visible:outline-none"
										>
											{post.cover && (
												<div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container-high">
													<Image
														src={post.cover}
														alt=""
														fill
														sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
														className="object-cover"
													/>
												</div>
											)}
											<CardContent className="flex flex-1 flex-col p-6">
												<div className="flex flex-wrap items-center gap-2">
													{post.tags.slice(0, 2).map((tag) => (
														<Badge key={tag} variant="secondary">
															{tag}
														</Badge>
													))}
												</div>
												<h3 className="mt-4 font-heading text-lg font-semibold tracking-[-0.03em] text-foreground group-focus-visible:text-brand">
													{post.title}
												</h3>
												<p className="mt-3 flex-1 font-sans text-sm leading-[1.7] text-muted-foreground">
													{post.description}
												</p>
												<div className="mt-6 flex items-center justify-between font-sans text-xs text-muted-foreground">
													<time dateTime={post.date}>
														{dateFmt.format(new Date(post.date))}
													</time>
													<span>
														{t('readingTime', {
															minutes: post.readingTimeMinutes,
														})}
													</span>
												</div>
											</CardContent>
										</Link>
									</Card>
								</ScrollReveal>
							))}
						</div>
					)}
				</div>
			</section>
		</>
	)
}
