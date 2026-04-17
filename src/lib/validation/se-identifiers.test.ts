import { describe, it, expect } from 'vitest'
import {
	isValidOrgNumber,
	isValidPersonalNumber,
	isValidSwedishVatNumberFormat,
	luhnCheck10,
	parseOrgNumber,
	parsePersonalNumber,
} from '@/lib/validation/se-identifiers'

describe('luhnCheck10', () => {
	it('accepts valid Luhn sequences', () => {
		expect(luhnCheck10('5560362138')).toBe(true)
		expect(luhnCheck10('8112189876')).toBe(true)
	})

	it('rejects sequences with a flipped digit', () => {
		expect(luhnCheck10('5560362139')).toBe(false)
		expect(luhnCheck10('8112189877')).toBe(false)
	})

	it('rejects non-10-digit inputs', () => {
		expect(luhnCheck10('')).toBe(false)
		expect(luhnCheck10('123')).toBe(false)
		expect(luhnCheck10('12345678901')).toBe(false)
		expect(luhnCheck10('abcdefghij')).toBe(false)
	})
})

describe('parseOrgNumber', () => {
	it('accepts correctly-formatted org numbers with and without dash', () => {
		expect(parseOrgNumber('556036-2138')).toEqual({
			normalized: '5560362138',
			formatted: '556036-2138',
		})
		expect(parseOrgNumber('5560362138')).toEqual({
			normalized: '5560362138',
			formatted: '556036-2138',
		})
		expect(parseOrgNumber(' 556036 - 2138 ')).toEqual({
			normalized: '5560362138',
			formatted: '556036-2138',
		})
	})

	it('rejects invalid Luhn checksum', () => {
		expect(parseOrgNumber('556036-2139')).toBeNull()
	})

	it('rejects numbers where third digit < 2 (would be personnummer)', () => {
		// 801218-9876: third digit is "1" -> rejected as org.nr
		expect(parseOrgNumber('801218-9876')).toBeNull()
	})

	it('rejects the wrong length', () => {
		expect(parseOrgNumber('12345-6789')).toBeNull()
		expect(parseOrgNumber('55603621380')).toBeNull()
	})

	it('rejects empty / non-string input', () => {
		expect(parseOrgNumber('')).toBeNull()
		// @ts-expect-error – testing runtime guard
		expect(parseOrgNumber(null)).toBeNull()
		// @ts-expect-error – testing runtime guard
		expect(parseOrgNumber(123)).toBeNull()
	})

	it('isValidOrgNumber is a thin wrapper around parseOrgNumber', () => {
		expect(isValidOrgNumber('556036-2138')).toBe(true)
		expect(isValidOrgNumber('556036-2139')).toBe(false)
	})
})

describe('parsePersonalNumber', () => {
	const refNow = new Date('2026-04-17T00:00:00Z')

	it('accepts a valid 10-digit personnummer', () => {
		const info = parsePersonalNumber('811218-9876', refNow)
		expect(info).not.toBeNull()
		expect(info!.normalized10).toBe('8112189876')
		expect(info!.normalized12).toBe('198112189876')
		expect(info!.formatted).toBe('19811218-9876')
		expect(info!.birthDate).toBe('1981-12-18')
		expect(info!.isCoordinationNumber).toBe(false)
	})

	it('accepts a valid 12-digit personnummer', () => {
		const info = parsePersonalNumber('198112189876', refNow)
		expect(info).not.toBeNull()
		expect(info!.normalized12).toBe('198112189876')
	})

	it('accepts "+" separator for centenarians', () => {
		// Same 10-digit number but with "+" means 100 years older.
		const info = parsePersonalNumber('811218+9876', refNow)
		expect(info).not.toBeNull()
		expect(info!.birthDate).toBe('1881-12-18')
	})

	it('accepts a samordningsnummer (day + 60)', () => {
		// 640883-3231 decodes to birth date 1964-08-23 with the +60
		// coordination-number offset. Luhn-valid.
		const info = parsePersonalNumber('640883-3231', refNow)
		expect(info).not.toBeNull()
		expect(info!.isCoordinationNumber).toBe(true)
		expect(info!.birthDate).toBe('1964-08-23')
	})

	it('rejects invalid date (month 13)', () => {
		expect(parsePersonalNumber('811318-9876', refNow)).toBeNull()
	})

	it('rejects Feb 30', () => {
		expect(parsePersonalNumber('810230-1234', refNow)).toBeNull()
	})

	it('rejects future birth date', () => {
		const future = new Date('2000-01-01T00:00:00Z')
		// 11-12-18 would be 2011 under the "yy > currentYY -> last century" rule
		// when current is 2000 (YY=00) -> 11 > 0 -> 1911? This is fine (past).
		// Construct a genuinely-future 12-digit input.
		expect(parsePersonalNumber('201012181234', future)).toBeNull()
	})

	it('rejects invalid Luhn', () => {
		expect(parsePersonalNumber('811218-9877', refNow)).toBeNull()
	})

	it('rejects non-string input', () => {
		// @ts-expect-error – testing runtime guard
		expect(parsePersonalNumber(null)).toBeNull()
		// @ts-expect-error – testing runtime guard
		expect(parsePersonalNumber(undefined)).toBeNull()
	})

	it('isValidPersonalNumber wraps parser', () => {
		expect(isValidPersonalNumber('811218-9876', refNow)).toBe(true)
		expect(isValidPersonalNumber('811218-9877', refNow)).toBe(false)
	})
})

describe('isValidSwedishVatNumberFormat', () => {
	it('accepts SE + 12 digits ending in 01', () => {
		expect(isValidSwedishVatNumberFormat('SE556036213801')).toBe(true)
		expect(isValidSwedishVatNumberFormat('se556036213801')).toBe(true)
		expect(isValidSwedishVatNumberFormat('SE 556036 213801')).toBe(true)
	})

	it('rejects missing SE prefix', () => {
		expect(isValidSwedishVatNumberFormat('556036213801')).toBe(false)
	})

	it('rejects wrong suffix', () => {
		expect(isValidSwedishVatNumberFormat('SE556036213802')).toBe(false)
	})

	it('rejects wrong length', () => {
		expect(isValidSwedishVatNumberFormat('SE5560362138')).toBe(false)
	})
})
