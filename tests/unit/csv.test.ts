import { describe, expect, it } from 'vitest'
import { formatMinorAmount, toCsv } from '@/lib/csv'

describe('toCsv', () => {
	it('emits BOM + header + rows separated by CRLF', () => {
		const out = toCsv(['a', 'b'], [['1', '2']])
		expect(out.startsWith('\uFEFF')).toBe(true)
		expect(out.slice(1)).toBe('a,b\r\n1,2\r\n')
	})

	it('quotes values that contain commas, quotes, or newlines', () => {
		const out = toCsv(
			['text'],
			[['hello, world'], ['say "hi"'], ['line1\nline2']],
		)
		expect(out).toContain('"hello, world"')
		expect(out).toContain('"say ""hi"""')
		expect(out).toContain('"line1\nline2"')
	})

	it('renders null and undefined as empty fields', () => {
		const out = toCsv(['a', 'b', 'c'], [[null, undefined, 'x']])
		expect(out).toContain(',,x\r\n')
	})

	it('handles numeric values', () => {
		const out = toCsv(['n'], [[42], [3.14]])
		expect(out).toContain('42\r\n')
		expect(out).toContain('3.14\r\n')
	})
})

describe('formatMinorAmount', () => {
	it('formats minor units as decimal string with 2 places', () => {
		expect(formatMinorAmount(0)).toBe('0.00')
		expect(formatMinorAmount(12345)).toBe('123.45')
		expect(formatMinorAmount(100)).toBe('1.00')
	})
})
