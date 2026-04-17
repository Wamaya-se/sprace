import 'server-only'

import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { cache } from 'react'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog')

export interface BlogPostMeta {
	slug: string
	title: string
	description: string
	date: string
	author: string
	cover?: string | null
	readingTimeMinutes: number
	tags: string[]
}

export interface BlogPost extends BlogPostMeta {
	markdown: string
}

interface RawFrontmatter {
	title?: string
	description?: string
	date?: string
	author?: string
	cover?: string | null
	tags?: string[]
}

function slugFromFilename(filename: string): string {
	return filename.replace(/\.mdx?$/i, '')
}

function estimateReadingTimeMinutes(markdown: string): number {
	const words = markdown
		.replace(/```[\s\S]*?```/g, '')
		.replace(/[#>*_`~\[\]()!-]/g, ' ')
		.split(/\s+/)
		.filter(Boolean).length
	const WORDS_PER_MIN = 200
	return Math.max(1, Math.round(words / WORDS_PER_MIN))
}

async function readAllFiles(): Promise<string[]> {
	try {
		const files = await fs.readdir(CONTENT_DIR)
		return files.filter((f) => /\.mdx?$/i.test(f))
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
		throw err
	}
}

async function loadPostFromFile(filename: string): Promise<BlogPost | null> {
	const filePath = path.join(CONTENT_DIR, filename)
	let raw: string
	try {
		raw = await fs.readFile(filePath, 'utf8')
	} catch {
		return null
	}
	const { data, content } = matter(raw)
	const fm = data as RawFrontmatter

	if (!fm.title || !fm.date) {
		return null
	}

	const slug = slugFromFilename(filename)
	return {
		slug,
		title: fm.title,
		description: fm.description ?? '',
		date: fm.date,
		author: fm.author ?? 'Sprace Team',
		cover: fm.cover ?? null,
		tags: Array.isArray(fm.tags) ? fm.tags : [],
		readingTimeMinutes: estimateReadingTimeMinutes(content),
		markdown: content,
	}
}

export const getAllBlogPosts = cache(async (): Promise<BlogPostMeta[]> => {
	const files = await readAllFiles()
	const posts = await Promise.all(files.map(loadPostFromFile))
	return posts
		.filter((p): p is BlogPost => p !== null)
		.map((p): BlogPostMeta => {
			return {
				slug: p.slug,
				title: p.title,
				description: p.description,
				date: p.date,
				author: p.author,
				cover: p.cover,
				tags: p.tags,
				readingTimeMinutes: p.readingTimeMinutes,
			}
		})
		.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
})

export const getBlogPost = cache(
	async (slug: string): Promise<BlogPost | null> => {
		if (!/^[a-z0-9-]+$/i.test(slug)) return null
		for (const ext of ['.mdx', '.md'] as const) {
			const post = await loadPostFromFile(`${slug}${ext}`)
			if (post) return post
		}
		return null
	},
)

export async function getBlogSlugs(): Promise<string[]> {
	const files = await readAllFiles()
	return files.map(slugFromFilename)
}
