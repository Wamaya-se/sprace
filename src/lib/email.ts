import 'server-only'

import { Resend } from 'resend'
import { env } from '@/lib/env'

let _resend: Resend | null = null

function getResend() {
	if (!_resend) {
		_resend = new Resend(env.resendApiKey)
	}
	return _resend
}

interface SendEmailParams {
	to: string
	subject: string
	html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
	try {
		await getResend().emails.send({
			from: env.emailFromAddress,
			to,
			subject,
			html,
		})
	} catch (err) {
		console.error('[sendEmail]', err)
	}
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function escapeUrlPath(value: string): string {
	return encodeURI(value).replace(/"/g, '%22')
}

export function buildNotificationEmail(
	title: string,
	body: string,
	link?: string | null,
	ctaLabel = 'View details',
): string {
	const safeTitle = escapeHtml(title)
	const safeBody = escapeHtml(body)
	const safeCta = escapeHtml(ctaLabel)
	const buttonHtml = link
		? `<a href="${escapeUrlPath(env.siteUrl + link)}" style="display:inline-block;padding:12px 24px;background:#6C5CE7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">${safeCta}</a>`
		: ''

	return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 20px;">
<tr><td style="padding-bottom:24px;">
<img src="${escapeUrlPath(env.siteUrl + '/sprace-logo.png')}" alt="Sprace" height="32" style="height:32px;width:auto;">
</td></tr>
<tr><td style="background:#141414;border-radius:12px;padding:32px;">
<h1 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#FFFFFF;">${safeTitle}</h1>
<p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.6);">${safeBody}</p>
${buttonHtml}
</td></tr>
<tr><td style="padding-top:24px;text-align:center;">
<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">Sprace — Influencer &amp; UGC Marketplace</p>
</td></tr>
</table>
</body>
</html>`
}
