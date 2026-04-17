/**
 * Minimal, dependency-free CSV builder. Escapes values per RFC 4180
 * (double-quote fields that contain commas, quotes, or newlines; escape
 * inner quotes by doubling). Emits a BOM so Excel opens SEK-formatted
 * output correctly on Windows.
 */
export function toCsv(
	headers: readonly string[],
	rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
	const escape = (value: string | number | null | undefined): string => {
		if (value === null || value === undefined) return ''
		const str = String(value)
		if (/[",\r\n]/.test(str)) {
			return `"${str.replace(/"/g, '""')}"`
		}
		return str
	}

	const headerLine = headers.map(escape).join(',')
	const bodyLines = rows.map((row) => row.map(escape).join(','))
	return '\uFEFF' + [headerLine, ...bodyLines].join('\r\n') + '\r\n'
}

export function formatMinorAmount(minor: number): string {
	return (minor / 100).toFixed(2)
}
