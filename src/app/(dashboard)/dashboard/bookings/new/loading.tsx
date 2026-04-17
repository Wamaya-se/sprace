export default function NewBookingLoading() {
	return (
		<div className="mx-auto max-w-3xl">
			<div className="h-4 w-40 animate-pulse rounded bg-surface-container" />

			<div className="mt-6 flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<div className="h-4 w-20 animate-pulse rounded bg-surface-container" />
					<div className="h-10 w-full animate-pulse rounded-xl bg-surface-container" />
				</div>

				<div className="flex flex-col gap-2">
					<div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
					<div className="h-32 w-full animate-pulse rounded-xl bg-surface-container" />
				</div>

				<div className="flex flex-col gap-2">
					<div className="h-4 w-16 animate-pulse rounded bg-surface-container" />
					<div className="h-10 w-full animate-pulse rounded-xl bg-surface-container" />
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex flex-col gap-2">
						<div className="h-4 w-14 animate-pulse rounded bg-surface-container" />
						<div className="h-10 w-full animate-pulse rounded-xl bg-surface-container" />
					</div>
					<div className="flex flex-col gap-2">
						<div className="h-4 w-16 animate-pulse rounded bg-surface-container" />
						<div className="h-10 w-full animate-pulse rounded-xl bg-surface-container" />
					</div>
				</div>

				<div className="flex gap-3 pt-2">
					<div className="h-10 w-32 animate-pulse rounded-xl bg-surface-container" />
					<div className="h-10 w-24 animate-pulse rounded-xl bg-surface-container" />
				</div>
			</div>
		</div>
	)
}
