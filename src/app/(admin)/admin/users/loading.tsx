import { Skeleton } from '@/components/ui/skeleton'

export default function AdminUsersLoading() {
	return (
		<div className="mx-auto max-w-5xl">
			<Skeleton className="h-5 w-48" />

			<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
				<Skeleton className="h-10 w-full rounded-xl sm:max-w-xs" />
				<Skeleton className="h-10 w-32 rounded-xl" />
				<Skeleton className="h-10 w-32 rounded-xl" />
			</div>

			<div className="mt-6">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-4 border-b border-outline-variant/10 px-2 py-3"
					>
						<Skeleton className="h-4 w-32 bg-surface-container" />
						<Skeleton className="h-4 w-40 bg-surface-container" />
						<Skeleton className="h-5 w-16 rounded-full bg-surface-container" />
						<Skeleton className="h-5 w-16 rounded-full bg-surface-container" />
						<Skeleton className="h-4 w-20 bg-surface-container" />
						<Skeleton className="h-4 w-8 bg-surface-container" />
					</div>
				))}
			</div>
		</div>
	)
}
