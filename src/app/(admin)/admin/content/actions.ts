'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'
import type { ActionResult } from '@/types/actions'

function toSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[åä]/g, 'a')
		.replace(/ö/g, 'o')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}

// --- Specialties ---

const specialtySchema = z.object({
	name: z.string().trim().min(1).max(100),
	slug: z.string().trim().max(100).optional(),
})

export async function createSpecialty(
	name: string,
	slug?: string,
): Promise<ActionResult<{ id: string }>> {
	const { supabase } = await requireAdmin()

	const parsed = specialtySchema.safeParse({ name, slug })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const finalSlug = parsed.data.slug || toSlug(parsed.data.name)

	const { data, error } = await supabase
		.from('specialties')
		.insert({ name: parsed.data.name, slug: finalSlug })
		.select('id')
		.single()

	if (error) {
		console.error('[createSpecialty]', error)
		if (error.code === '23505') {
			return { success: false, error: 'errors.duplicateSpecialty' }
		}
		return { success: false, error: 'errors.couldNotCreateSpecialty' }
	}

	revalidatePath('/admin/content')
	revalidateTag('specialties', 'max')
	return { success: true, data: { id: data.id } }
}

export async function updateSpecialty(
	id: string,
	name: string,
	slug?: string,
): Promise<ActionResult> {
	const { supabase } = await requireAdmin()

	if (!z.string().uuid().safeParse(id).success) {
		return { success: false, error: 'errors.invalidId' }
	}

	const parsed = specialtySchema.safeParse({ name, slug })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const finalSlug = parsed.data.slug || toSlug(parsed.data.name)

	const { error } = await supabase
		.from('specialties')
		.update({ name: parsed.data.name, slug: finalSlug })
		.eq('id', id)

	if (error) {
		console.error('[updateSpecialty]', error)
		if (error.code === '23505') {
			return { success: false, error: 'errors.duplicateSpecialty' }
		}
		return { success: false, error: 'errors.couldNotUpdateSpecialty' }
	}

	revalidatePath('/admin/content')
	revalidateTag('specialties', 'max')
	return { success: true, data: undefined }
}

export async function deleteSpecialty(id: string): Promise<ActionResult> {
	const { supabase } = await requireAdmin()

	if (!z.string().uuid().safeParse(id).success) {
		return { success: false, error: 'errors.invalidId' }
	}

	const { error } = await supabase.from('specialties').delete().eq('id', id)

	if (error) {
		console.error('[deleteSpecialty]', error)
		return { success: false, error: 'errors.couldNotDeleteSpecialty' }
	}

	revalidatePath('/admin/content')
	revalidateTag('specialties', 'max')
	return { success: true, data: undefined }
}

// --- Markets ---

const marketSchema = z.object({
	name: z.string().trim().min(1).max(100),
	slug: z.string().trim().max(100).optional(),
	code: z.string().trim().min(1).max(20),
	flagEmoji: z.string().trim().max(10).optional(),
	sortOrder: z.coerce.number().int().min(0).default(0),
})

export async function createMarket(data: {
	name: string
	slug?: string
	code: string
	flagEmoji?: string
	sortOrder?: number
}): Promise<ActionResult<{ id: string }>> {
	const { supabase } = await requireAdmin()

	const parsed = marketSchema.safeParse(data)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const finalSlug = parsed.data.slug || toSlug(parsed.data.name)

	const { data: row, error } = await supabase
		.from('markets')
		.insert({
			name: parsed.data.name,
			slug: finalSlug,
			code: parsed.data.code,
			flag_emoji: parsed.data.flagEmoji || null,
			sort_order: parsed.data.sortOrder,
		})
		.select('id')
		.single()

	if (error) {
		console.error('[createMarket]', error)
		if (error.code === '23505') {
			return { success: false, error: 'errors.duplicateMarket' }
		}
		return { success: false, error: 'errors.couldNotCreateMarket' }
	}

	revalidatePath('/admin/content')
	return { success: true, data: { id: row.id } }
}

export async function updateMarket(
	id: string,
	data: {
		name: string
		slug?: string
		code: string
		flagEmoji?: string
		sortOrder?: number
	},
): Promise<ActionResult> {
	const { supabase } = await requireAdmin()

	if (!z.string().uuid().safeParse(id).success) {
		return { success: false, error: 'errors.invalidId' }
	}

	const parsed = marketSchema.safeParse(data)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const finalSlug = parsed.data.slug || toSlug(parsed.data.name)

	const { error } = await supabase
		.from('markets')
		.update({
			name: parsed.data.name,
			slug: finalSlug,
			code: parsed.data.code,
			flag_emoji: parsed.data.flagEmoji || null,
			sort_order: parsed.data.sortOrder,
		})
		.eq('id', id)

	if (error) {
		console.error('[updateMarket]', error)
		if (error.code === '23505') {
			return { success: false, error: 'errors.duplicateMarket' }
		}
		return { success: false, error: 'errors.couldNotUpdateMarket' }
	}

	revalidatePath('/admin/content')
	return { success: true, data: undefined }
}

export async function deleteMarket(id: string): Promise<ActionResult> {
	const { supabase } = await requireAdmin()

	if (!z.string().uuid().safeParse(id).success) {
		return { success: false, error: 'errors.invalidId' }
	}

	const { error } = await supabase.from('markets').delete().eq('id', id)

	if (error) {
		console.error('[deleteMarket]', error)
		return { success: false, error: 'errors.couldNotDeleteMarket' }
	}

	revalidatePath('/admin/content')
	return { success: true, data: undefined }
}
