import { StyleSheet } from '@react-pdf/renderer'

// Sprace brand palette (light-mode values — PDFs are always light).
export const pdfColors = {
	text: '#0F0F0F',
	muted: '#6B6B6B',
	subtle: '#9B9B9B',
	border: '#E5E5E5',
	surface: '#FAFAFA',
	brand: '#E34B7D',
	brandDark: '#6C5CE7',
}

export const pdfStyles = StyleSheet.create({
	page: {
		padding: 48,
		fontSize: 10,
		fontFamily: 'Helvetica',
		color: pdfColors.text,
		lineHeight: 1.5,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 40,
	},
	brand: {
		fontSize: 18,
		fontFamily: 'Helvetica-Bold',
		color: pdfColors.text,
		letterSpacing: -0.5,
	},
	docKind: {
		fontSize: 11,
		color: pdfColors.muted,
		marginTop: 2,
	},
	docNumber: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
		color: pdfColors.text,
	},
	docMeta: {
		fontSize: 9,
		color: pdfColors.muted,
		textAlign: 'right',
	},
	partiesRow: {
		flexDirection: 'row',
		gap: 32,
		marginBottom: 32,
	},
	party: {
		flex: 1,
	},
	partyLabel: {
		fontSize: 8,
		textTransform: 'uppercase',
		letterSpacing: 1,
		color: pdfColors.subtle,
		marginBottom: 6,
	},
	partyName: {
		fontSize: 11,
		fontFamily: 'Helvetica-Bold',
		marginBottom: 2,
	},
	partyLine: {
		fontSize: 9,
		color: pdfColors.muted,
	},
	sectionTitle: {
		fontSize: 9,
		textTransform: 'uppercase',
		letterSpacing: 1,
		color: pdfColors.subtle,
		marginBottom: 10,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
	},
	table: {
		marginBottom: 24,
	},
	tableHeader: {
		flexDirection: 'row',
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
		fontSize: 8,
		textTransform: 'uppercase',
		letterSpacing: 1,
		color: pdfColors.subtle,
	},
	tableRow: {
		flexDirection: 'row',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: pdfColors.border,
	},
	cellDesc: {
		flex: 3,
	},
	cellAmount: {
		flex: 1,
		textAlign: 'right',
	},
	totalsBlock: {
		marginLeft: 'auto',
		width: '45%',
	},
	totalsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 6,
	},
	totalsLabel: {
		fontSize: 10,
		color: pdfColors.muted,
	},
	totalsValue: {
		fontSize: 10,
	},
	grandTotalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: 12,
		marginTop: 6,
		borderTopWidth: 1,
		borderTopColor: pdfColors.text,
	},
	grandTotalLabel: {
		fontSize: 12,
		fontFamily: 'Helvetica-Bold',
	},
	grandTotalValue: {
		fontSize: 12,
		fontFamily: 'Helvetica-Bold',
	},
	footer: {
		position: 'absolute',
		bottom: 32,
		left: 48,
		right: 48,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: pdfColors.border,
		fontSize: 8,
		color: pdfColors.subtle,
		textAlign: 'center',
	},
	note: {
		marginTop: 24,
		padding: 12,
		backgroundColor: pdfColors.surface,
		fontSize: 9,
		color: pdfColors.muted,
	},
})

/**
 * Platform-entity metadata used on PDFs is loaded from `platform_settings`
 * via `src/lib/queries/platform-entity.ts`. Keep PDF components
 * dependency-free from Supabase so they can be rendered in tests and
 * previews — the caller must pass a `PlatformEntity` into the component.
 */
export interface PdfPartyEntity {
	legalName: string
	orgNumber: string
	vatNumber: string
	addressLines: string[]
	email: string
	website: string
}
