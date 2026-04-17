'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useActionError } from '@/hooks/use-action-error'
import {
	updateUserRole,
	updateCreatorStatus,
	deleteUser,
} from '../../../actions'

interface UserActionsProps {
	userId: string
	currentRole: 'creator' | 'business' | 'admin'
	creatorId?: string
	creatorStatus?: 'draft' | 'pending_review' | 'active' | 'suspended'
	isSelf: boolean
}

export function UserActions({
	userId,
	currentRole,
	creatorId,
	creatorStatus,
	isSelf,
}: UserActionsProps) {
	const t = useTranslations('admin')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [selectedRole, setSelectedRole] = useState(currentRole)
	const te = useActionError()

	const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedRole(e.target.value as typeof currentRole)
	}

	const confirmRoleChange = () => {
		if (selectedRole === currentRole) return
		setError(null)
		startTransition(async () => {
			const result = await updateUserRole(userId, selectedRole)
			if (!result.success) {
				setError(te(result.error))
			} else {
				router.refresh()
			}
		})
	}

	const handleStatusChange = (newStatus: 'active' | 'suspended' | 'draft') => {
		if (!creatorId) return
		setError(null)
		startTransition(async () => {
			const result = await updateCreatorStatus(creatorId, newStatus)
			if (!result.success) {
				setError(te(result.error))
			} else {
				router.refresh()
			}
		})
	}

	const handleDelete = () => {
		setError(null)
		startTransition(async () => {
			const result = await deleteUser(userId)
			if (!result.success) {
				setError(te(result.error))
			} else {
				router.push('/admin/users')
			}
		})
	}

	const canSuspend =
		currentRole === 'creator' &&
		creatorStatus &&
		(creatorStatus === 'active' || creatorStatus === 'pending_review')
	const canActivate = currentRole === 'creator' && creatorStatus === 'suspended'
	const canApprove =
		currentRole === 'creator' && creatorStatus === 'pending_review'
	const canReject =
		currentRole === 'creator' && creatorStatus === 'pending_review'

	return (
		<div className="space-y-6">
			{error && (
				<div role="alert" className="rounded-lg bg-destructive/10 p-3">
					<p className="font-sans text-sm text-destructive">{error}</p>
				</div>
			)}

			{!isSelf && (
				<div className="space-y-3">
					<h3 className="font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
						{t('changeRole')}
					</h3>

					<div className="flex items-center gap-3">
						<NativeSelect
							value={selectedRole}
							onChange={handleRoleChange}
							disabled={isPending}
							aria-label={t('changeRole')}
						>
							<option value="creator">{t('roleCreator')}</option>
							<option value="business">{t('roleBusiness')}</option>
							<option value="admin">{t('roleAdmin')}</option>
						</NativeSelect>

						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="secondary"
									size="sm"
									disabled={isPending || selectedRole === currentRole}
								>
									{t('changeRoleConfirm')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t('changeRole')}</AlertDialogTitle>
									<AlertDialogDescription>
										{t('changeRoleDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('changeRoleCancel')}</AlertDialogCancel>
									<AlertDialogAction onClick={confirmRoleChange}>
										{t('changeRoleConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
			)}

			{currentRole === 'creator' && creatorId && (
				<div className="space-y-3">
					<h3 className="font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
						{t('status')}
					</h3>
					<div className="flex flex-wrap gap-2">
						{canApprove && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="brand" size="sm" disabled={isPending}>
										{t('approveCreator')}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t('approveCreator')}</AlertDialogTitle>
										<AlertDialogDescription>
											{t('approveDescription')}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											{t('changeRoleCancel')}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => handleStatusChange('active')}
										>
											{t('approveConfirm')}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{canReject && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="ghost" size="sm" disabled={isPending}>
										{t('rejectCreator')}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t('rejectCreator')}</AlertDialogTitle>
										<AlertDialogDescription>
											{t('rejectDescription')}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											{t('changeRoleCancel')}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => handleStatusChange('draft')}
										>
											{t('rejectConfirm')}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{canSuspend && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="destructive" size="sm" disabled={isPending}>
										{t('suspendCreator')}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t('suspendCreator')}</AlertDialogTitle>
										<AlertDialogDescription>
											{t('suspendDescription')}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											{t('changeRoleCancel')}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => handleStatusChange('suspended')}
										>
											{t('suspendConfirm')}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{canActivate && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="brand" size="sm" disabled={isPending}>
										{t('activateCreator')}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t('activateCreator')}</AlertDialogTitle>
										<AlertDialogDescription>
											{t('activateDescription')}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											{t('changeRoleCancel')}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => handleStatusChange('active')}
										>
											{t('activateConfirm')}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</div>
			)}

			{!isSelf && (
				<div className="space-y-3 border-t border-outline-variant/10 pt-6">
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="sm" disabled={isPending}>
								{t('deleteUser')}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t('deleteUser')}</AlertDialogTitle>
								<AlertDialogDescription>
									{t('deleteUserDescription')}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t('deleteUserCancel')}</AlertDialogCancel>
								<AlertDialogAction onClick={handleDelete}>
									{t('deleteUserConfirm')}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			)}
		</div>
	)
}
