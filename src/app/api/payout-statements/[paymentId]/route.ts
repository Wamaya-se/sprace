import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateCreatorPayoutStatement } from '@/lib/pdf/receipts'

const paramsSchema = z.object({ paymentId: z.string().uuid() })

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ paymentId: string }> },
) {
	const parsed = paramsSchema.safeParse(await params)
	if (!parsed.success) {
		return NextResponse.json({ error: 'Invalid payment id' }, { status: 400 })
	}

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { data: payment, error } = await supabase
		.from('payments')
		.select(
			`
			id,
			status,
			booking:bookings!payments_booking_id_fkey(
				creator:creators!bookings_creator_id_fkey(profile_id)
			)
		`,
		)
		.eq('id', parsed.data.paymentId)
		.single()

	if (error || !payment) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	const booking = payment.booking as unknown as {
		creator: { profile_id: string } | null
	} | null

	const isAdmin = user.app_metadata?.role === 'admin'
	if (!isAdmin && booking?.creator?.profile_id !== user.id) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	if (payment.status !== 'transferred') {
		return NextResponse.json(
			{ error: 'Payout statement not yet available' },
			{ status: 409 },
		)
	}

	try {
		const { buffer, filename } = await generateCreatorPayoutStatement(
			payment.id,
		)
		return new NextResponse(new Uint8Array(buffer), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Cache-Control': 'private, no-store',
			},
		})
	} catch (err) {
		console.error('[api/payout-statements] generation failed', err)
		return NextResponse.json(
			{ error: 'Payout statement generation failed' },
			{ status: 500 },
		)
	}
}
