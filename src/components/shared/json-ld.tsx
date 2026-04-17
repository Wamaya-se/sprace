interface JsonLdProps {
	data: unknown
}

/**
 * Renders a JSON-LD `<script>` tag. Accepts any serializable value — typically
 * a Schema.org object or array of objects. Falls back to an empty string when
 * `data` is nullish so callers can pass conditional values without branching.
 */
export function JsonLd({ data }: JsonLdProps) {
	if (data === null || data === undefined) return null
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	)
}
