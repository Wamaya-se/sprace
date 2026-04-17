import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/shared/json-ld'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getBlogPost, getBlogSlugs } from '@/lib/blog/posts'
import { renderMarkdown } from '@/lib/blog/render'
import { env } from '@/lib/env'
import { getOrganizationJsonLd } from '@/lib/seo/organization'

interface PageProps {
	params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
	const slugs = await getBlogSlugs()
	return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const post = await getBlogPost(slug)
	if (!post) return {}
	const canonical = `/blog/${post.slug}`
	return {
		title: post.title,
		description: post.description,
		openGraph: {
			title: post.title,
			description: post.description,
			type: 'article',
			publishedTime: post.date,
			authors: [post.author],
			images: post.cover ? [{ url: post.cover }] : undefined,
		},
		twitter: {
			card: 'summary_large_image',
			title: post.title,
			description: post.description,
			images: post.cover ? [post.cover] : undefined,
		},
		alternates: { canonical },
	}
}

export default async function BlogPostPage({ params }: PageProps) {
	const { slug } = await params
	const post = await getBlogPost(slug)
	if (!post) notFound()

	const [html, locale, organization, t] = await Promise.all([
		renderMarkdown(post.markdown),
		getLocale(),
		getOrganizationJsonLd(),
		getTranslations('blog'),
	])

	const siteUrl = env.siteUrl
	const url = `${siteUrl}/blog/${post.slug}`
	const dateFmt = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	const postJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		'@id': `${url}#post`,
		mainEntityOfPage: url,
		headline: post.title,
		description: post.description,
		url,
		datePublished: post.date,
		dateModified: post.date,
		author: { '@type': 'Person', name: post.author },
		publisher: { '@id': `${siteUrl}/#organization` },
		image: post.cover ? [post.cover] : undefined,
		keywords: post.tags.join(', '),
	}

	const breadcrumbs = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: siteUrl,
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: t('heroTitle'),
				item: `${siteUrl}/blog`,
			},
			{
				'@type': 'ListItem',
				position: 3,
				name: post.title,
				item: url,
			},
		],
	}

	return (
		<>
			<JsonLd data={organization} />
			<JsonLd data={postJsonLd} />
			<JsonLd data={breadcrumbs} />

			<article className="mx-auto max-w-3xl px-6 pt-32 pb-24">
				<nav aria-label={t('breadcrumbLabel')} className="mb-8">
					<Link
						href="/blog"
						className="rounded-sm font-sans text-sm text-muted-foreground transition-opacity duration-200 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
					>
						{t('backToIndex')}
					</Link>
				</nav>

				<header>
					<div className="flex flex-wrap items-center gap-2">
						{post.tags.map((tag) => (
							<Badge key={tag} variant="secondary">
								{tag}
							</Badge>
						))}
					</div>
					<h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-foreground md:text-5xl">
						{post.title}
					</h1>
					<p className="mt-5 font-sans text-lg leading-[1.7] text-muted-foreground">
						{post.description}
					</p>
					<div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-muted-foreground">
						<span>{post.author}</span>
						<time dateTime={post.date}>
							{dateFmt.format(new Date(post.date))}
						</time>
						<span>
							{t('readingTime', { minutes: post.readingTimeMinutes })}
						</span>
					</div>
				</header>

				{post.cover && (
					<div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-surface-container">
						<Image
							src={post.cover}
							alt=""
							fill
							sizes="(max-width: 1024px) 100vw, 768px"
							className="object-cover"
							priority
						/>
					</div>
				)}

				<div
					className="prose-sprace mt-10 font-sans text-base leading-[1.8] text-foreground/80"
					dangerouslySetInnerHTML={{ __html: html }}
				/>

				<div className="mt-16 flex flex-col items-start gap-4 rounded-2xl bg-surface-container p-8 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
							{t('ctaTitle')}
						</h2>
						<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('ctaSubtitle')}
						</p>
					</div>
					<Button asChild>
						<Link href="/register">{t('ctaButton')}</Link>
					</Button>
				</div>
			</article>
		</>
	)
}
