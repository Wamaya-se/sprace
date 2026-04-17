import { Document, Page, Text, View } from '@react-pdf/renderer'
import { type PdfPartyEntity, pdfStyles } from './styles'

export interface CreatorPayoutStatementData {
	statementNumber: string
	issuedAt: Date
	currency: string
	amountTotal: number
	platformFee: number
	creatorPayout: number
	platform: PdfPartyEntity
	booking: {
		id: string
		title: string
	}
	business: {
		companyName: string
	}
	creator: {
		displayName: string
		profileEmail: string
	}
	payment: {
		stripeTransferId: string | null
		transferredAt: Date | null
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

export function CreatorPayoutStatement({
	data,
}: {
	data: CreatorPayoutStatementData
}) {
	return (
		<Document
			title={`Payout statement ${data.statementNumber}`}
			author={data.platform.legalName}
			subject={`Booking ${data.booking.id}`}
		>
			<Page size="A4" style={pdfStyles.page}>
				<View style={pdfStyles.header}>
					<View>
						<Text style={pdfStyles.brand}>Sprace</Text>
						<Text style={pdfStyles.docKind}>
							Payout statement — Utbetalningsspecifikation
						</Text>
					</View>
					<View>
						<Text style={pdfStyles.docNumber}>{data.statementNumber}</Text>
						<Text style={pdfStyles.docMeta}>
							Issued {formatDate(data.issuedAt)}
						</Text>
					</View>
				</View>

				<View style={pdfStyles.partiesRow}>
					<View style={pdfStyles.party}>
						<Text style={pdfStyles.partyLabel}>Issued by</Text>
						<Text style={pdfStyles.partyName}>{data.platform.legalName}</Text>
						<Text style={pdfStyles.partyLine}>
							Org.no {data.platform.orgNumber}
						</Text>
						{data.platform.vatNumber && data.platform.vatNumber !== '—' ? (
							<Text style={pdfStyles.partyLine}>
								VAT {data.platform.vatNumber}
							</Text>
						) : null}
						{data.platform.addressLines.map((line) => (
							<Text key={line} style={pdfStyles.partyLine}>
								{line}
							</Text>
						))}
						<Text style={pdfStyles.partyLine}>{data.platform.email}</Text>
					</View>

					<View style={pdfStyles.party}>
						<Text style={pdfStyles.partyLabel}>Paid to</Text>
						<Text style={pdfStyles.partyName}>{data.creator.displayName}</Text>
						<Text style={pdfStyles.partyLine}>{data.creator.profileEmail}</Text>
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
								Booked by: {data.business.companyName}
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
						<Text style={pdfStyles.totalsLabel}>Booking amount</Text>
						<Text style={pdfStyles.totalsValue}>
							{formatAmount(data.amountTotal, data.currency)}
						</Text>
					</View>
					<View style={pdfStyles.totalsRow}>
						<Text style={pdfStyles.totalsLabel}>Platform fee</Text>
						<Text style={pdfStyles.totalsValue}>
							−{formatAmount(data.platformFee, data.currency)}
						</Text>
					</View>
					<View style={pdfStyles.grandTotalRow}>
						<Text style={pdfStyles.grandTotalLabel}>Net payout</Text>
						<Text style={pdfStyles.grandTotalValue}>
							{formatAmount(data.creatorPayout, data.currency)}
						</Text>
					</View>
				</View>

				<View style={pdfStyles.note}>
					<Text>
						This is a record of the gross-to-net breakdown for the above
						booking. The net amount has been transferred to your connected
						Stripe account.
						{data.payment.stripeTransferId
							? ` Stripe transfer: ${data.payment.stripeTransferId}.`
							: ''}{' '}
						You are responsible for declaring this income to the relevant tax
						authority.
					</Text>
				</View>

				<Text style={pdfStyles.footer} fixed>
					{data.platform.legalName} · {data.platform.website} · Retain this
					statement for your tax records.
				</Text>
			</Page>
		</Document>
	)
}
