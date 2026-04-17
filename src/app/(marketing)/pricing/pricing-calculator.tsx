'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'

interface PricingCalculatorProps {
	feePercent: number
}

const MIN_AMOUNT = 500
const MAX_AMOUNT = 100_000
const STEP = 500
const DEFAULT_AMOUNT = 8_000

function formatSek(value: number): string {
	return new Intl.NumberFormat('sv-SE', {
		maximumFractionDigits: 0,
	}).format(value)
}

export function PricingCalculator({ feePercent }: PricingCalculatorProps) {
	const t = useTranslations('pricing')
	const [amount, setAmount] = useState(DEFAULT_AMOUNT)

	const { platformFee, creatorPayout, businessTotal } = useMemo(() => {
		const fee = Math.round(amount * (feePercent / 100))
		return {
			platformFee: fee,
			creatorPayout: amount - fee,
			businessTotal: amount,
		}
	}, [amount, feePercent])

	const currency = t('calculatorCurrency')

	return (
		<Card className="bg-surface-container p-8 md:p-10">
			<CardContent className="p-0">
				<div className="flex flex-col gap-3">
					<label
						htmlFor="pricing-calculator-amount"
						className="font-sans text-sm text-foreground/70"
					>
						{t('calculatorAmountLabel')}
					</label>
					<div className="flex items-baseline gap-2">
						<span className="font-heading text-5xl font-bold tracking-[-0.03em] text-foreground md:text-6xl">
							{formatSek(amount)}
						</span>
						<span className="font-sans text-base text-muted-foreground">
							{currency}
						</span>
					</div>
					<input
						id="pricing-calculator-amount"
						type="range"
						min={MIN_AMOUNT}
						max={MAX_AMOUNT}
						step={STEP}
						value={amount}
						onChange={(e) => setAmount(Number(e.target.value))}
						className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-container-highest accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
						aria-valuetext={`${formatSek(amount)} ${currency}`}
					/>
					<div className="flex justify-between font-sans text-xs text-muted-foreground">
						<span>
							{formatSek(MIN_AMOUNT)} {currency}
						</span>
						<span>
							{formatSek(MAX_AMOUNT)} {currency}
						</span>
					</div>
				</div>

				<dl className="mt-10 grid gap-6 md:grid-cols-3">
					<div className="flex flex-col gap-2">
						<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
							{t('calculatorBusinessTotalLabel')}
						</dt>
						<dd className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
							{formatSek(businessTotal)} {currency}
						</dd>
					</div>
					<div className="flex flex-col gap-2">
						<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
							{t('calculatorPlatformFeeLabel', { percent: feePercent })}
						</dt>
						<dd className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
							{formatSek(platformFee)} {currency}
						</dd>
					</div>
					<div className="flex flex-col gap-2">
						<dt className="font-sans text-xs uppercase tracking-wider text-brand">
							{t('calculatorCreatorPayoutLabel')}
						</dt>
						<dd className="font-heading text-2xl font-bold tracking-[-0.03em] text-brand">
							{formatSek(creatorPayout)} {currency}
						</dd>
					</div>
				</dl>
			</CardContent>
		</Card>
	)
}
