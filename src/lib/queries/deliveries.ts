import 'server-only'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bookingIdSchema = z.string().uuid()

export type DeliveryItem = {
	id: string
	version: number
	comment: string | null
	revision_comment: string | null
	status: string
	submitted_by: string
	reviewed_by: string | null
	reviewed_at: string | null
	created_at: string
	files: Array<{
		id: string
		file_url: string
		file_name: string
		file_size: number
		mime_type: string
		sort_order: number
	}>
}

export async function getDeliveries(
	bookingId: string,
): Promise<DeliveryItem[]> {
	const parsed = bookingIdSchema.safeParse(bookingId)
	if (!parsed.success) return []

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return []

	const { data: deliveries, error } = await supabase
		.from('booking_deliveries')
		.select(
			`
			id, version, comment, revision_comment, status,
			submitted_by, reviewed_by, reviewed_at, created_at
		`,
		)
		.eq('booking_id', parsed.data)
		.order('version', { ascending: false })

	if (error || !deliveries) {
		console.error('[getDeliveries]', error)
		return []
	}

	if (deliveries.length === 0) return []

	const deliveryIds = deliveries.map((d) => d.id)
	const { data: allFiles } = await supabase
		.from('delivery_files')
		.select(
			'id, delivery_id, file_url, file_name, file_size, mime_type, sort_order',
		)
		.in('delivery_id', deliveryIds)
		.order('sort_order', { ascending: true })

	const fileMap = new Map<string, DeliveryItem['files']>()
	for (const file of allFiles ?? []) {
		const existing = fileMap.get(file.delivery_id) ?? []
		existing.push({
			id: file.id,
			file_url: file.file_url,
			file_name: file.file_name,
			file_size: file.file_size,
			mime_type: file.mime_type,
			sort_order: file.sort_order,
		})
		fileMap.set(file.delivery_id, existing)
	}

	return deliveries.map((d) => ({
		...d,
		files: fileMap.get(d.id) ?? [],
	}))
}
