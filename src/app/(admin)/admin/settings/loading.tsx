import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSettingsLoading() {
	return (
		<div className="mx-auto max-w-2xl">
			<Skeleton className="h-5 w-48 mb-6" />

			<div className="space-y-6">
				<div className="rounded-xl bg-surface-container p-6">
					<Skeleton className="h-6 w-24 bg-surface-container-high" />
					<div className="mt-4 space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i}>
								<Skeleton className="h-4 w-28 bg-surface-container-high" />
								<Skeleton className="mt-1.5 h-10 w-full rounded-xl bg-surface-container-high" />
							</div>
						))}
					</div>
				</div>

				<div className="rounded-xl bg-surface-container p-6">
					<Skeleton className="h-6 w-16 bg-surface-container-high" />
					<div className="mt-4 space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i}>
								<Skeleton className="h-4 w-28 bg-surface-container-high" />
								<Skeleton className="mt-1.5 h-10 w-full rounded-xl bg-surface-container-high" />
							</div>
						))}
					</div>
				</div>

				<div className="flex justify-end">
					<Skeleton className="h-10 w-24 rounded-xl" />
				</div>
			</div>
		</div>
	)
}
