'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { useActionError } from '@/hooks/use-action-error'
import { createBroadcast, sendBroadcast } from '@/lib/actions/broadcasts'
import type { BroadcastAudience } from '@/lib/validation/admin'

interface FormState {
	title: string
	body: string
	audience: BroadcastAudience
	link: string
}

const EMPTY: FormState = {
	title: '',
	body: '',
	audience: 'all',
	link: '',
}

export function BroadcastComposer() {
	const t = useTranslations('broadcasts')
	const te = useActionError()
	const router = useRouter()

	const [form, setForm] = useState<FormState>(EMPTY)
	const [error, setError] = useState<string | null>(null)
	const [info, setInfo] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	function update<K extends keyof FormState>(key: K, value: FormState[K]) {
		setForm((prev) => ({ ...prev, [key]: value }))
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setError(null)
		setInfo(null)

		const submitter = (e.nativeEvent as SubmitEvent).submitter as
			| HTMLButtonElement
			| undefined
		const intent = submitter?.value ?? 'save'

		startTransition(async () => {
			const fd = new FormData()
			fd.set('title', form.title.trim())
			fd.set('body', form.body.trim())
			fd.set('audience', form.audience)
			if (form.link.trim()) fd.set('link', form.link.trim())

			const created = await createBroadcast(fd)
			if (!created.success) {
				setError(te(created.error))
				return
			}

			if (intent === 'send') {
				const sent = await sendBroadcast(created.data.id)
				if (!sent.success) {
					setError(te(sent.error))
					return
				}
				setInfo(
					t('sentInfo', {
						recipients: sent.data.recipients,
					}),
				)
			} else {
				setInfo(t('draftSavedInfo'))
			}

			setForm(EMPTY)
			router.refresh()
		})
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}
			{info && (
				<p role="status" className="font-sans text-sm text-foreground">
					{info}
				</p>
			)}

			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<Label htmlFor="broadcast-title">{t('titleLabel')}</Label>
					<Input
						id="broadcast-title"
						name="title"
						value={form.title}
						onChange={(e) => update('title', e.target.value)}
						placeholder={t('titlePlaceholder')}
						minLength={3}
						maxLength={200}
						required
						className="mt-1.5"
					/>
				</div>

				<div>
					<Label htmlFor="broadcast-audience">{t('audienceLabel')}</Label>
					<NativeSelect
						id="broadcast-audience"
						name="audience"
						value={form.audience}
						onChange={(e) =>
							update('audience', e.target.value as BroadcastAudience)
						}
						className="mt-1.5"
					>
						<option value="all">{t('audienceAll')}</option>
						<option value="creators">{t('audienceCreators')}</option>
						<option value="businesses">{t('audienceBusinesses')}</option>
					</NativeSelect>
				</div>
			</div>

			<div>
				<Label htmlFor="broadcast-body">{t('bodyLabel')}</Label>
				<Textarea
					id="broadcast-body"
					name="body"
					value={form.body}
					onChange={(e) => update('body', e.target.value)}
					placeholder={t('bodyPlaceholder')}
					minLength={10}
					maxLength={4000}
					rows={5}
					required
					className="mt-1.5"
				/>
			</div>

			<div>
				<Label htmlFor="broadcast-link">{t('linkLabel')}</Label>
				<Input
					id="broadcast-link"
					name="link"
					type="url"
					value={form.link}
					onChange={(e) => update('link', e.target.value)}
					placeholder={t('linkPlaceholder')}
					maxLength={500}
					className="mt-1.5"
				/>
				<p className="mt-1.5 font-sans text-xs text-muted-foreground">
					{t('linkHelp')}
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="submit"
					name="intent"
					value="send"
					variant="brand"
					disabled={isPending}
				>
					{isPending ? t('sending') : t('sendNow')}
				</Button>
				<Button
					type="submit"
					name="intent"
					value="save"
					variant="ghost"
					disabled={isPending}
				>
					{isPending ? t('saving') : t('saveDraft')}
				</Button>
			</div>
		</form>
	)
}
