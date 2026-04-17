'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface UserRow {
	id: string
	fullName: string | null
	email: string
	role: 'creator' | 'business' | 'admin'
	createdAt: string
	creatorStatus?: 'draft' | 'pending_review' | 'active' | 'suspended' | null
}

interface UsersTableProps {
	users: UserRow[]
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
	creator: 'default',
	business: 'secondary',
	admin: 'outline',
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> =
	{
		draft: 'outline',
		pending_review: 'secondary',
		active: 'default',
		suspended: 'outline',
	}

export function UsersTable({ users }: UsersTableProps) {
	const t = useTranslations('admin')
	const [search, setSearch] = useState('')
	const [roleFilter, setRoleFilter] = useState<string>('all')
	const [statusFilter, setStatusFilter] = useState<string>('all')

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim()
		return users.filter((user) => {
			if (q) {
				const name = (user.fullName ?? '').toLowerCase()
				const email = user.email.toLowerCase()
				if (!name.includes(q) && !email.includes(q)) return false
			}
			if (roleFilter !== 'all' && user.role !== roleFilter) return false
			if (statusFilter !== 'all') {
				if (!user.creatorStatus || user.creatorStatus !== statusFilter)
					return false
			}
			return true
		})
	}, [users, search, roleFilter, statusFilter])

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
		[],
	)

	const handleRoleChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value),
		[],
	)

	const handleStatusChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) =>
			setStatusFilter(e.target.value),
		[],
	)

	const roleLabel = (role: string) => {
		const map: Record<string, string> = {
			creator: t('roleCreator'),
			business: t('roleBusiness'),
			admin: t('roleAdmin'),
		}
		return map[role] ?? role
	}

	const statusLabel = (status: string) => {
		const map: Record<string, string> = {
			draft: t('statusDraft'),
			pending_review: t('statusPendingReview'),
			active: t('statusActive'),
			suspended: t('statusSuspended'),
		}
		return map[status] ?? status
	}

	return (
		<div>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<Input
					value={search}
					onChange={handleSearchChange}
					placeholder={t('searchUsers')}
					className="sm:max-w-xs"
				/>
				<NativeSelect
					value={roleFilter}
					onChange={handleRoleChange}
					aria-label={t('filterByRole')}
				>
					<option value="all">{t('filterByRole')}</option>
					<option value="creator">{t('roleCreator')}</option>
					<option value="business">{t('roleBusiness')}</option>
					<option value="admin">{t('roleAdmin')}</option>
				</NativeSelect>
				<NativeSelect
					value={statusFilter}
					onChange={handleStatusChange}
					aria-label={t('filterByStatus')}
				>
					<option value="all">{t('filterByStatus')}</option>
					<option value="draft">{t('statusDraft')}</option>
					<option value="pending_review">{t('statusPendingReview')}</option>
					<option value="active">{t('statusActive')}</option>
					<option value="suspended">{t('statusSuspended')}</option>
				</NativeSelect>
			</div>

			<div className="mt-6 overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-b border-outline-variant/10">
							<th className="px-3 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
								{t('name')}
							</th>
							<th className="px-3 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
								{t('email')}
							</th>
							<th className="px-3 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
								{t('role')}
							</th>
							<th className="px-3 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
								{t('status')}
							</th>
							<th className="px-3 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
								{t('joined')}
							</th>
							<th className="px-3 py-3 text-right font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
								{t('actions')}
							</th>
						</tr>
					</thead>
					<tbody>
						{filtered.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-3 py-12 text-center font-sans text-sm text-muted-foreground"
								>
									{t('noUsersFound')}
								</td>
							</tr>
						) : (
							filtered.map((user) => (
								<tr
									key={user.id}
									className="border-b border-outline-variant/5 hover:bg-surface-container-low/50"
								>
									<td className="px-3 py-3 font-sans text-sm font-medium text-foreground">
										{user.fullName || (
											<span className="text-muted-foreground">&mdash;</span>
										)}
									</td>
									<td className="px-3 py-3 font-sans text-sm text-foreground/60">
										{user.email}
									</td>
									<td className="px-3 py-3">
										<Badge variant={roleBadgeVariant[user.role] ?? 'outline'}>
											{roleLabel(user.role)}
										</Badge>
									</td>
									<td className="px-3 py-3">
										{user.role === 'creator' && user.creatorStatus ? (
											<Badge
												variant={
													statusBadgeVariant[user.creatorStatus] ?? 'outline'
												}
											>
												{statusLabel(user.creatorStatus)}
											</Badge>
										) : (
											<span className="font-sans text-xs text-foreground/20">
												&mdash;
											</span>
										)}
									</td>
									<td className="px-3 py-3 font-sans text-sm text-muted-foreground">
										{formatDate(user.createdAt)}
									</td>
									<td className="px-3 py-3 text-right">
										<Button variant="ghost" size="xs" asChild>
											<Link href={`/admin/users/${user.id}`}>
												{t('viewUser')}
											</Link>
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
