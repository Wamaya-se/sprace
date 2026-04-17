/**
 * Pure fee calculation helpers. Intentionally NOT marked `server-only` so
 * these can be unit-tested in Node/Vitest without having to spin up the
 * Next.js RSC boundary.
 *
 * All money values are in smallest currency unit (öre/cent, integer).
 */

export interface FeeBreakdown {
	amountTotal: number
	platformFee: number
	creatorPayout: number
}

export function calculateFees(
	amountCents: number,
	feePercent: number,
): FeeBreakdown {
	const platformFee = Math.round(amountCents * (feePercent / 100))
	return {
		amountTotal: amountCents,
		platformFee,
		creatorPayout: amountCents - platformFee,
	}
}
