'use client'

import { useRef, useEffect, useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { sendMessage } from '@/lib/actions/messages'
import type { MessageItem } from '@/lib/queries/messages'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'

interface MessageThreadProps {
	conversationId: string
	currentUserId: string
	initialMessages: MessageItem[]
	otherParticipantName: string
}

function formatMessageTime(dateStr: string): string {
	const date = new Date(dateStr)
	return date.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	})
}

function formatMessageDate(
	dateStr: string,
	today: string,
	yesterday: string,
): string {
	const date = new Date(dateStr)
	const now = new Date()
	const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

	if (diffDays === 0) return today
	if (diffDays === 1) return yesterday
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

function groupMessagesByDate(
	messages: MessageItem[],
	today: string,
	yesterday: string,
): { date: string; messages: MessageItem[] }[] {
	const groups: { date: string; messages: MessageItem[] }[] = []
	let currentDate = ''

	for (const msg of messages) {
		const msgDate = new Date(msg.created_at).toDateString()
		if (msgDate !== currentDate) {
			currentDate = msgDate
			groups.push({
				date: formatMessageDate(msg.created_at, today, yesterday),
				messages: [msg],
			})
		} else {
			groups[groups.length - 1].messages.push(msg)
		}
	}

	return groups
}

export function MessageThread({
	conversationId,
	currentUserId,
	initialMessages,
	otherParticipantName,
}: MessageThreadProps) {
	const t = useTranslations('messages')
	const { messages, addOptimisticMessage, removeOptimisticMessage } =
		useRealtimeMessages({
			conversationId,
			currentUserId,
			initialMessages,
		})
	const [isPending, startTransition] = useTransition()
	const [sendError, setSendError] = useState<string | null>(null)
	const scrollRef = useRef<HTMLDivElement>(null)
	const formRef = useRef<HTMLFormElement>(null)

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [messages])

	function handleSubmit(formData: FormData) {
		const rawContent = formData.get('content')
		const content = typeof rawContent === 'string' ? rawContent : ''
		if (!content.trim()) return

		setSendError(null)

		const optimisticId = crypto.randomUUID()
		const optimisticMsg: MessageItem = {
			id: optimisticId,
			content: content.trim(),
			sender_id: currentUserId,
			is_system: false,
			read_at: null,
			created_at: new Date().toISOString(),
		}

		addOptimisticMessage(optimisticMsg)
		formRef.current?.reset()

		startTransition(async () => {
			const result = await sendMessage(formData)
			if (!result.success) {
				removeOptimisticMessage(optimisticId)
				setSendError(t('sendFailed'))
			}
		})
	}

	const groupedMessages = groupMessagesByDate(
		messages,
		t('today'),
		t('yesterday'),
	)

	return (
		<div className="flex flex-col gap-4">
			{/* Messages area */}
			<div
				ref={scrollRef}
				className="flex max-h-[60vh] min-h-[300px] flex-col gap-3 overflow-y-auto rounded-xl bg-surface-container p-4"
			>
				{messages.length === 0 && (
					<p className="py-12 text-center font-sans text-sm text-muted-foreground">
						{t('noMessages')}
					</p>
				)}

				{groupedMessages.map((group) => (
					<div key={group.date}>
						<div className="my-3 flex items-center gap-3">
							<div className="h-px flex-1 bg-outline-variant/10" />
							<span className="font-sans text-xs text-muted-foreground">
								{group.date}
							</span>
							<div className="h-px flex-1 bg-outline-variant/10" />
						</div>

						{group.messages.map((msg) => {
							const isOwn = msg.sender_id === currentUserId
							const isSystem = msg.is_system

							if (isSystem) {
								return (
									<div key={msg.id} className="my-2 flex justify-center">
										<span className="rounded-full bg-surface-container-high px-3 py-1 font-sans text-xs text-muted-foreground">
											{msg.content}
										</span>
									</div>
								)
							}

							return (
								<div
									key={msg.id}
									className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
								>
									<div
										className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
											isOwn
												? 'bg-brand/15 text-foreground'
												: 'bg-surface-container-high text-foreground/80'
										}`}
									>
										{!isOwn && (
											<p className="mb-0.5 font-sans text-xs font-medium text-muted-foreground">
												{otherParticipantName}
											</p>
										)}
										<p className="whitespace-pre-wrap font-sans text-sm leading-[1.6]">
											{msg.content}
										</p>
										<p
											className={`mt-1 text-right font-sans text-[10px] ${
												isOwn ? 'text-muted-foreground' : 'text-foreground/20'
											}`}
										>
											{formatMessageTime(msg.created_at)}
										</p>
									</div>
								</div>
							)
						})}
					</div>
				))}
			</div>

			{sendError && (
				<p role="alert" className="font-sans text-xs text-destructive">
					{sendError}
				</p>
			)}

			{/* Send form */}
			<form ref={formRef} action={handleSubmit} className="flex gap-2">
				<input type="hidden" name="conversationId" value={conversationId} />
				<Textarea
					name="content"
					placeholder={t('messagePlaceholder')}
					aria-label={t('sendMessage')}
					rows={1}
					maxLength={5000}
					className="min-h-[44px] resize-none"
					disabled={isPending}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault()
							formRef.current?.requestSubmit()
						}
					}}
				/>
				<Button
					type="submit"
					size="sm"
					disabled={isPending}
					className="self-end"
				>
					{isPending ? t('sending') : t('sendMessage')}
				</Button>
			</form>
		</div>
	)
}
