import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sprace.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: BASE_URL,
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 1,
		},
		{
			url: `${BASE_URL}/login`,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.5,
		},
		{
			url: `${BASE_URL}/register`,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.6,
		},
		{
			url: `${BASE_URL}/register/creator`,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.6,
		},
		{
			url: `${BASE_URL}/register/business`,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.6,
		},
		{
			url: `${BASE_URL}/privacy`,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.4,
		},
		{
			url: `${BASE_URL}/terms`,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.4,
		},
	]

	const supabase = await createClient()

	const [creatorsRes, specialtiesRes] = await Promise.all([
		supabase
			.from('creators')
			.select('slug, updated_at')
			.eq('status', 'active')
			.not('slug', 'is', null),
		supabase.from('specialties').select('slug').order('name'),
	])

	const creatorPages: MetadataRoute.Sitemap = (creatorsRes.data ?? []).map(
		(c) => ({
			url: `${BASE_URL}/creators/${c.slug}`,
			lastModified: new Date(c.updated_at),
			changeFrequency: 'weekly' as const,
			priority: 0.8,
		}),
	)

	const categoryIndex: MetadataRoute.Sitemap = [
		{
			url: `${BASE_URL}/creators`,
			lastModified: new Date(),
			changeFrequency: 'weekly' as const,
			priority: 0.9,
		},
	]

	const categoryPages: MetadataRoute.Sitemap = (specialtiesRes.data ?? []).map(
		(s) => ({
			url: `${BASE_URL}/creators/category/${s.slug}`,
			lastModified: new Date(),
			changeFrequency: 'weekly' as const,
			priority: 0.7,
		}),
	)

	return [...staticPages, ...categoryIndex, ...categoryPages, ...creatorPages]
}
