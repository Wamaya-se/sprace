import 'server-only'

import { marked } from 'marked'

marked.setOptions({
	gfm: true,
	breaks: false,
})

/**
 * Convert author-controlled Markdown to HTML. Safe to render with
 * `dangerouslySetInnerHTML` because the source files are committed to the
 * repo — not user-submitted content.
 */
export async function renderMarkdown(markdown: string): Promise<string> {
	return marked.parse(markdown, { async: true })
}
