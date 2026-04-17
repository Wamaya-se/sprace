/**
 * Validation for Swedish organization numbers (organisationsnummer) and
 * personal identity numbers (personnummer + samordningsnummer).
 *
 * Intentionally a pure module — no Node/browser APIs, no Supabase, no env —
 * so it can be unit-tested without runtime bootstrap.
 */

/**
 * Luhn ("modulus-10") checksum as used by Swedish personal and
 * organisation numbers. Operates on exactly 10 digits where the
 * rightmost digit is the check digit.
 *
 * Algorithm (leftmost = index 0):
 *   digit[i] *= (i is even ? 2 : 1)
 *   if digit > 9 subtract 9
 *   sum all; total % 10 must equal 0
 */
export function luhnCheck10(digits: string): boolean {
	if (!/^\d{10}$/.test(digits)) return false
	let sum = 0
	for (let i = 0; i < 10; i++) {
		let d = digits.charCodeAt(i) - 48
		if ((i & 1) === 0) {
			d *= 2
			if (d > 9) d -= 9
		}
		sum += d
	}
	return sum % 10 === 0
}

// ---------- Organization number ----------

export interface OrgNumberInfo {
	normalized: string
	formatted: string
}

/**
 * Validates a Swedish organization number. Accepts both
 * "NNNNNNNNNN" and "NNNNNN-NNNN". Returns normalized+formatted
 * representations on success, null on failure.
 *
 * Rules:
 *  - Exactly 10 digits after stripping non-digits.
 *  - Third digit must be 2-9 (distinguishes org.nr from
 *    personnummer, whose 3rd digit is the first month digit ≤ 1).
 *  - Luhn mod-10 checksum over all 10 digits.
 */
export function parseOrgNumber(input: string): OrgNumberInfo | null {
	if (typeof input !== 'string') return null
	const digits = input.replace(/[\s-]/g, '')
	if (!/^\d{10}$/.test(digits)) return null
	const thirdDigit = digits.charCodeAt(2) - 48
	if (thirdDigit < 2) return null
	if (!luhnCheck10(digits)) return null
	return {
		normalized: digits,
		formatted: `${digits.slice(0, 6)}-${digits.slice(6)}`,
	}
}

export function isValidOrgNumber(input: string): boolean {
	return parseOrgNumber(input) !== null
}

// ---------- Personal number (personnummer / samordningsnummer) ----------

export interface PersonalNumberInfo {
	normalized10: string
	normalized12: string
	formatted: string
	birthDate: string
	isCoordinationNumber: boolean
}

/**
 * Validates a Swedish personnummer or samordningsnummer.
 *
 * Accepted input formats:
 *   YYMMDD-XXXX, YYMMDDXXXX, YYMMDD+XXXX,
 *   YYYYMMDD-XXXX, YYYYMMDDXXXX, YYYYMMDD+XXXX.
 *
 * The "+" separator is traditionally used when the person is ≥ 100
 * years old; we accept it as equivalent to "-" because we compute
 * the century from the 4-digit year when present and otherwise
 * assume "under 100 years old".
 *
 * Samordningsnummer (coordination number): day-of-month has 60 added.
 * Month+day-60 still has to be a valid date.
 *
 * Luhn is computed over the 10-digit short form (YYMMDD + last 4).
 */
export function parsePersonalNumber(
	input: string,
	now: Date = new Date(),
): PersonalNumberInfo | null {
	if (typeof input !== 'string') return null
	const cleaned = input.replace(/\s/g, '')
	const match = cleaned.match(/^(\d{2})?(\d{6})([-+]?)(\d{4})$/)
	if (!match) return null

	const [, centuryPart, ymd6, , last4] = match

	let year: number
	let isCentenarian = false
	if (centuryPart) {
		year = parseInt(centuryPart + ymd6.slice(0, 2), 10)
	} else {
		const yy = parseInt(ymd6.slice(0, 2), 10)
		const currentYear = now.getUTCFullYear()
		const currentYY = currentYear % 100
		const currentCentury = Math.floor(currentYear / 100) * 100
		// If yy is in the future, it must be last century.
		year = yy > currentYY ? currentCentury - 100 + yy : currentCentury + yy
		isCentenarian = cleaned.includes('+')
		if (isCentenarian) year -= 100
	}

	const month = parseInt(ymd6.slice(2, 4), 10)
	let day = parseInt(ymd6.slice(4, 6), 10)

	let isCoordinationNumber = false
	if (day >= 61 && day <= 91) {
		isCoordinationNumber = true
		day -= 60
	}

	if (month < 1 || month > 12) return null
	if (day < 1 || day > 31) return null

	// Validate the calendar date matches the Y/M/D (month-length aware).
	const birthDate = new Date(Date.UTC(year, month - 1, day))
	if (
		birthDate.getUTCFullYear() !== year ||
		birthDate.getUTCMonth() !== month - 1 ||
		birthDate.getUTCDate() !== day
	) {
		return null
	}

	// Not a valid birthdate if in the future.
	if (birthDate.getTime() > now.getTime()) return null

	const normalized10 = ymd6 + last4
	if (!luhnCheck10(normalized10)) return null

	const normalized12 = `${year.toString().padStart(4, '0')}${ymd6.slice(2)}${last4}`
	const formatted = `${normalized12.slice(0, 8)}-${normalized12.slice(8)}`
	const birthDateISO = `${year.toString().padStart(4, '0')}-${month
		.toString()
		.padStart(2, '0')}-${day.toString().padStart(2, '0')}`

	return {
		normalized10,
		normalized12,
		formatted,
		birthDate: birthDateISO,
		isCoordinationNumber,
	}
}

export function isValidPersonalNumber(
	input: string,
	now: Date = new Date(),
): boolean {
	return parsePersonalNumber(input, now) !== null
}

// ---------- VAT number ----------

/**
 * Loose validation for Swedish VAT numbers ("momsregistreringsnummer").
 * Format: SE + 12 digits (ends in 01).
 *
 * We don't call the EU VIES API here — that belongs in a Server Action
 * with its own error path. This check only rejects obviously-malformed
 * input client-side.
 */
export function isValidSwedishVatNumberFormat(input: string): boolean {
	if (typeof input !== 'string') return false
	const normalized = input.replace(/\s/g, '').toUpperCase()
	return /^SE\d{10}01$/.test(normalized)
}

export function normalizeSwedishVatNumber(input: string): string {
	return input.replace(/\s/g, '').toUpperCase()
}
