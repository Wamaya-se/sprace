import { Skeleton } from '@/components/ui/skeleton'

export default function BlogIndexLoading() {
	return (
		<div className="mx-auto max-w-7xl px-6 pt-32 pb-20">
			<div className="mx-auto max-w-3xl text-center">
				<Skeleton className="mx-auto h-12 w-2/3" />
				<Skeleton className="mx-auto mt-4 h-5 w-full max-w-lg" />
			</div>
			<div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="rounded-xl bg-surface-container p-6">
						<Skeleton className="h-48 w-full" />
						<Skeleton className="mt-5 h-5 w-3/4" />
						<Skeleton className="mt-3 h-4 w-full" />
						<Skeleton className="mt-2 h-4 w-5/6" />
					</div>
				))}
			</div>
		</div>
	)
}
