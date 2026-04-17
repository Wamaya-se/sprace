import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { UsersTable } from './components/users-table'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('adminUsersTitle'),
	}
}

export default async function AdminUsersPage() {
	const t = await getTranslations('admin')
	const supabase = await createClient()

	const { data: profiles } = await supabase
		.from('profiles')
		.select('id, full_name, email, role, created_at')
		.order('created_at', { ascending: false })

	const creatorProfileIds = (profiles ?? [])
		.filter((p) => p.role === 'creator')
		.map((p) => p.id)

	let creatorStatuses: Record<string, string> = {}
	if (creatorProfileIds.length > 0) {
		const { data: creators } = await supabase
			.from('creators')
			.select('profile_id, status')
			.in('profile_id', creatorProfileIds)

		creatorStatuses = (creators ?? []).reduce<Record<string, string>>(
			(acc, c) => ({ ...acc, [c.profile_id]: c.status }),
			{},
		)
	}

	const users = (profiles ?? []).map((p) => ({
		id: p.id,
		fullName: p.full_name,
		email: p.email,
		role: p.role,
		createdAt: p.created_at,
		creatorStatus:
			p.role === 'creator'
				? ((creatorStatuses[p.id] as
						| 'draft'
						| 'pending_review'
						| 'active'
						| 'suspended'
						| undefined) ?? null)
				: null,
	}))

	return (
		<div className="mx-auto max-w-5xl">
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('usersDescription')}
			</p>

			<div className="mt-6">
				<UsersTable users={users} />
			</div>
		</div>
	)
}
