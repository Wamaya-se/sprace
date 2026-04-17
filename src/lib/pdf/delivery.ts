import 'server-only'

import { buildNotificationEmail, sendEmail } from '@/lib/email'
import {
	generateBusinessReceipt,
	generateCreatorPayoutStatement,
} from '@/lib/pdf/receipts'

interface DeliverDocParams {
	paymentId: string
	to: string
	subject: string
	bodyTitle: string
	bodyText: string
	link: string
	ctaLabel?: string
}

export async function deliverBusinessReceipt(params: DeliverDocParams) {
	try {
		const { buffer, filename } = await generateBusinessReceipt(params.paymentId)
		await sendEmail({
			to: params.to,
			subject: params.subject,
			html: buildNotificationEmail(
				params.bodyTitle,
				params.bodyText,
				params.link,
				params.ctaLabel,
			),
			attachments: [{ filename, content: buffer }],
		})
	} catch (err) {
		console.error('[deliverBusinessReceipt]', err)
	}
}

export async function deliverCreatorPayoutStatement(params: DeliverDocParams) {
	try {
		const { buffer, filename } = await generateCreatorPayoutStatement(
			params.paymentId,
		)
		await sendEmail({
			to: params.to,
			subject: params.subject,
			html: buildNotificationEmail(
				params.bodyTitle,
				params.bodyText,
				params.link,
				params.ctaLabel,
			),
			attachments: [{ filename, content: buffer }],
		})
	} catch (err) {
		console.error('[deliverCreatorPayoutStatement]', err)
	}
}
