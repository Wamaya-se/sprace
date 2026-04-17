import { Document, Page, Text, View } from '@react-pdf/renderer'
import { SPRACE_ENTITY, pdfStyles } from './styles'

export interface BusinessReceiptData {
	receiptNumber: string
	issuedAt: Date
	currency: string
	amountTotal: number
	platformFee: number
	booking: {
		id: string
		title: string
	}
	business: {
		companyName: string
		orgNumber: string | null
		contactEmail: string | null
		profileEmail: string
	}
	creator: {
		displayName: string
	}
	payment: {
		stripeChargeId: string | null
		capturedAt: Date | null
	}
}

function formatAmount(value: number, currency: string) {
	return `${(value / 100).toLocaleString('sv-SE', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})} ${currency.toUpperCase()}`
}

function formatDate(date: Date) {
	return date.toISOString().slice(0, 10)
}

export function BusinessReceipt({ data }: { data: BusinessReceiptData }) {
	const subtotal = data.amountTotal
	const vat = 0
	const total = subtotal + vat

	return (
		<Document
			title={`Receipt ${data.receiptNumber}`}
			author="Sprace"
			subject={`Booking ${data.booking.id}`}
		>
			<Page size="A4" style={pdfStyles.page}>
				<View style={pdfStyles.header}>
					<View>
						<Text style={pdfStyles.brand}>Sprace</Text>
						<Text style={pdfStyles.docKind}>Receipt — Kvitto</Text>
					</View>
					<View>
						<Text style={pdfStyles.docNumber}>{data.receiptNumber}</Text>
						<Text style={pdfStyles.docMeta}>
							Issued {formatDate(data.issuedAt)}
						</Text>
					</View>
				</View>

				<View style={pdfStyles.partiesRow}>
					<View style={pdfStyles.party}>
						<Text style={pdfStyles.partyLabel}>From</Text>
						<Text style={pdfStyles.partyName}>{SPRACE_ENTITY.legalName}</Text>
						<Text style={pdfStyles.partyLine}>
							Org.no {SPRACE_ENTITY.orgNumber}
						</Text>
						<Text style={pdfStyles.partyLine}>{SPRACE_ENTITY.address}</Text>
						<Text style={pdfStyles.partyLine}>{SPRACE_ENTITY.email}</Text>
					</View>

					<View style={pdfStyles.party}>
						<Text style={pdfStyles.partyLabel}>To</Text>
						<Text style={pdfStyles.partyName}>{data.business.companyName}</Text>
						{data.business.orgNumber ? (
							<Text style={pdfStyles.partyLine}>
								Org.no {data.business.orgNumber}
							</Text>
						) : null}
						<Text style={pdfStyles.partyLine}>
							{data.business.contactEmail ?? data.business.profileEmail}
						</Text>
					</View>
				</View>

				<View style={pdfStyles.table}>
					<View style={pdfStyles.tableHeader}>
						<Text style={pdfStyles.cellDesc}>Description</Text>
						<Text style={pdfStyles.cellAmount}>Amount</Text>
					</View>
					<View style={pdfStyles.tableRow}>
						<View style={pdfStyles.cellDesc}>
							<Text style={{ fontFamily: 'Helvetica-Bold' }}>
								{data.booking.title}
							</Text>
							<Text style={{ fontSize: 9, color: '#6B6B6B', marginTop: 2 }}>
								Creator: {data.creator.displayName}
							</Text>
							<Text style={{ fontSize: 8, color: '#9B9B9B', marginTop: 2 }}>
								Booking ref: {data.booking.id}
							</Text>
						</View>
						<Text style={pdfStyles.cellAmount}>
							{formatAmount(data.amountTotal, data.currency)}
						</Text>
					</View>
				</View>

				<View style={pdfStyles.totalsBlock}>
					<View style={pdfStyles.totalsRow}>
						<Text style={pdfStyles.totalsLabel}>Subtotal</Text>
						<Text style={pdfStyles.totalsValue}>
							{formatAmount(subtotal, data.currency)}
						</Text>
					</View>
					<View style={pdfStyles.totalsRow}>
						<Text style={pdfStyles.totalsLabel}>VAT (0%)</Text>
						<Text style={pdfStyles.totalsValue}>
							{formatAmount(vat, data.currency)}
						</Text>
					</View>
					<View style={pdfStyles.grandTotalRow}>
						<Text style={pdfStyles.grandTotalLabel}>Total paid</Text>
						<Text style={pdfStyles.grandTotalValue}>
							{formatAmount(total, data.currency)}
						</Text>
					</View>
				</View>

				<View style={pdfStyles.note}>
					<Text>
						Payment was processed by Stripe. The platform fee of{' '}
						{formatAmount(data.platformFee, data.currency)} is deducted from the
						creator payout — the total above is exactly what you paid.
						{data.payment.stripeChargeId
							? ` Stripe reference: ${data.payment.stripeChargeId}.`
							: ''}
					</Text>
				</View>

				<Text style={pdfStyles.footer} fixed>
					{SPRACE_ENTITY.legalName} · {SPRACE_ENTITY.website} · Retain this
					receipt for bookkeeping purposes.
				</Text>
			</Page>
		</Document>
	)
}
