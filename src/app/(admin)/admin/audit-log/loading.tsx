import { Skeleton } from '@/components/ui/skeleton'

export default function AdminAuditLogLoading() {
	return (
		<div className="mx-auto max-w-6xl">
			<Skeleton className="h-5 w-80" />

			<div className="mt-4 flex flex-wrap gap-2">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-8 w-24 rounded-xl" />
				))}
			</div>

			<div className="mt-6 overflow-hidden rounded-xl bg-surface-container">
				<div className="flex gap-4 border-b border-outline-variant/20 bg-surface-container-high p-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-3 w-20 bg-surface-container" />
					))}
				</div>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="flex gap-4 border-b border-outline-variant/10 p-4"
					>
						<Skeleton className="h-4 w-24 bg-surface-container-high" />
						<Skeleton className="h-4 w-32 bg-surface-container-high" />
						<Skeleton className="h-5 w-28 rounded-full bg-surface-container-high" />
						<Skeleton className="h-4 w-40 bg-surface-container-high" />
						<Skeleton className="h-4 w-20 bg-surface-container-high" />
					</div>
				))}
			</div>
		</div>
	)
}
