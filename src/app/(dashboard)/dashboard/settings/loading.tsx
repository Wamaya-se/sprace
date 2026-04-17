import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
	return (
		<div className="mx-auto max-w-2xl">
			<Skeleton className="h-5 w-48" />

			<div className="mt-8 rounded-xl bg-surface-container p-8">
				<Skeleton className="h-4 w-full bg-surface-container-high" />
				<Skeleton className="mt-2 h-4 w-3/4 bg-surface-container-high" />
			</div>
		</div>
	)
}
