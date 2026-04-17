import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { markAsRead } from '@/lib/actions/messages'
import { getMessages } from '@/lib/queries/messages'
import { MessageThread } from '@/components/dashboard/message-thread'

interface PageProps {
	params: Promise<{ id: string }>
}

async function getConversationData(conversationId: string) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return null

	const { data: conversation, error } = await supabase
		.from('conversations')
		.select('id, booking_id, participant_one, participant_two')
		.eq('id', conversationId)
		.single()

	if (error || !conversation) return null

	const isParticipant =
		conversation.participant_one === user.id ||
		conversation.participant_two === user.id

	if (!isParticipant) return null

	const otherUserId =
		conversation.participant_one === user.id
			? conversation.participant_two
			: conversation.participant_one

	const { data: otherProfile } = await supabase
		.from('profiles')
		.select('id, full_name, avatar_url')
		.eq('id', otherUserId)
		.single()

	return {
		conversation,
		currentUserId: user.id,
		otherParticipant: otherProfile ?? {
			id: otherUserId,
			full_name: null,
			avatar_url: null,
		},
	}
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params
	const data = await getConversationData(id)
	const t = await getTranslations('metadata')
	const tm = await getTranslations('messages')

	if (!data) {
		return { title: t('messagesTitle') }
	}

	return {
		title: t('conversationTitle', {
			name: data.otherParticipant.full_name ?? tm('unknownUser'),
		}),
	}
}

export default async function ConversationPage({ params }: PageProps) {
	const { id } = await params
	const t = await getTranslations('messages')

	const data = await getConversationData(id)
	if (!data) {
		redirect('/dashboard/messages')
	}

	await markAsRead(id)

	const messages = await getMessages(id)

	return (
		<div className="mx-auto flex max-w-3xl flex-col">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Link
					href="/dashboard/messages"
					className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-foreground/70"
				>
					<svg
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={1.5}
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
						/>
					</svg>
					{t('backToInbox')}
				</Link>
			</div>

			<div className="mt-4">
				<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
					{t('conversationWith', {
						name: data.otherParticipant.full_name ?? t('unknownUser'),
					})}
				</h2>
				{data.conversation.booking_id && (
					<Link
						href={`/dashboard/bookings/${data.conversation.booking_id}`}
						className="mt-1 inline-flex font-sans text-xs text-brand hover:underline"
					>
						{t('viewBooking')}
					</Link>
				)}
			</div>

			{/* Messages thread */}
			<div className="mt-6 flex-1">
				<MessageThread
					conversationId={id}
					currentUserId={data.currentUserId}
					initialMessages={messages}
					otherParticipantName={
						data.otherParticipant.full_name ?? t('unknownUser')
					}
				/>
			</div>
		</div>
	)
}
