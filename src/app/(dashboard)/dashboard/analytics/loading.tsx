import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
	return (
		<div className="mx-auto max-w-6xl">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<Skeleton className="h-4 w-72" />
				<Skeleton className="h-9 w-80" />
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardContent>
							<Skeleton className="h-4 w-24" />
							<Skeleton className="mt-3 h-9 w-32" />
							<Skeleton className="mt-2 h-3 w-40" />
						</CardContent>
					</Card>
				))}
			</div>

			<div className="mt-8 space-y-6">
				<Card>
					<CardContent>
						<Skeleton className="h-5 w-40" />
						<Skeleton className="mt-4 h-64 w-full" />
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<Skeleton className="h-5 w-48" />
						<Skeleton className="mt-4 h-64 w-full" />
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
