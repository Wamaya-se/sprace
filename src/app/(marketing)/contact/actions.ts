'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/email'
import { getPlatformEntity } from '@/lib/queries/platform-entity'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import type { ActionResult } from '@/types/actions'

const SUBJECTS = [
	'general',
	'support',
	'press',
	'partnership',
	'other',
] as const

const schema = z.object({
	name: z.string().trim().min(2).max(120),
	email: z.string().email().max(255),
	subject: z.enum(SUBJECTS),
	message: z.string().trim().min(20).max(5000),
	company: z.string().max(255).optional(),
})

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export async function submitContactForm(
	formData: FormData,
): Promise<ActionResult<{ sent: boolean }>> {
	const honeypot = formData.get('website')
	if (typeof honeypot === 'string' && honeypot.trim() !== '') {
		return { success: true, data: { sent: true } }
	}

	const parsed = schema.safeParse({
		name: formData.get('name'),
		email: formData.get('email'),
		subject: formData.get('subject'),
		message: formData.get('message'),
		company: formData.get('company') || undefined,
	})

	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const h = await headers()
	const ip = getClientIp(h)
	const rl = await checkRateLimit(
		'auth',
		`contact:${ip}:${parsed.data.email.toLowerCase()}`,
	)
	if (!rl.success) {
		return { success: false, error: 'errors.tooManyRequests' }
	}

	const entity = await getPlatformEntity()
	const inbox = entity.billingEmail || env.emailFromAddress

	const { name, email, subject, message, company } = parsed.data
	const safeName = escapeHtml(name)
	const safeEmail = escapeHtml(email)
	const safeSubject = escapeHtml(subject)
	const safeCompany = company ? escapeHtml(company) : ''
	const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

	const html = `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
  <h2>New contact form submission</h2>
  <table cellpadding="6" cellspacing="0" border="0">
    <tr><td><strong>Subject:</strong></td><td>${safeSubject}</td></tr>
    <tr><td><strong>Name:</strong></td><td>${safeName}</td></tr>
    <tr><td><strong>Email:</strong></td><td><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
    ${safeCompany ? `<tr><td><strong>Company:</strong></td><td>${safeCompany}</td></tr>` : ''}
  </table>
  <hr>
  <p style="line-height:1.6">${safeMessage}</p>
</body>
</html>`

	try {
		await sendEmail({
			to: inbox,
			subject: `[Contact — ${subject}] ${name}`,
			html,
		})
	} catch (err) {
		console.error('[submitContactForm]', err)
		return { success: false, error: 'errors.contactEmailFailed' }
	}

	return { success: true, data: { sent: true } }
}
