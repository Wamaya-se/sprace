'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

async function requireBusiness() {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()
	if (error || !user) {
		redirect('/login')
	}

	const { data: business } = await supabase
		.from('businesses')
		.select('id, company_name')
		.eq('profile_id', user.id)
		.single()

	if (!business) {
		redirect('/dashboard')
	}

	return { user, supabase, business }
}

// --- Company info (name, org number, industry) ---

const companyInfoSchema = z.object({
	companyName: z.string().trim().min(1).max(200),
	orgNumber: z.preprocess(
		(v) => (v === '' ? undefined : v),
		z.string().trim().max(50).optional(),
	),
	industry: z.preprocess(
		(v) => (v === '' ? undefined : v),
		z.string().trim().max(100).optional(),
	),
})

export async function updateBusinessInfo(
	companyName: string,
	orgNumber: string,
	industry: string,
): Promise<ActionResult> {
	const { supabase, business } = await requireBusiness()

	const parsed = companyInfoSchema.safeParse({
		companyName,
		orgNumber,
		industry,
	})
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const { error } = await supabase
		.from('businesses')
		.update({
			company_name: parsed.data.companyName,
			org_number: parsed.data.orgNumber || null,
			industry: parsed.data.industry || null,
		})
		.eq('id', business.id)

	if (error) {
		console.error('[updateBusinessInfo]', error)
		return { success: false, error: 'errors.couldNotUpdateCompanyInfo' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}

// --- Contact & web (website, contact email) ---

const companyContactSchema = z.object({
	website: z.preprocess(
		(v) => (v === '' ? undefined : v),
		z.string().url().max(500).optional(),
	),
	contactEmail: z.preprocess(
		(v) => (v === '' ? undefined : v),
		z.string().email().max(255).optional(),
	),
})

export async function updateBusinessContact(
	website: string,
	contactEmail: string,
): Promise<ActionResult> {
	const { supabase, business } = await requireBusiness()

	const parsed = companyContactSchema.safeParse({ website, contactEmail })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const { error } = await supabase
		.from('businesses')
		.update({
			website: parsed.data.website || null,
			contact_email: parsed.data.contactEmail || null,
		})
		.eq('id', business.id)

	if (error) {
		console.error('[updateBusinessContact]', error)
		return { success: false, error: 'errors.couldNotUpdateContactDetails' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}
