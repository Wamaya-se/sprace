export default function BookingDetailLoading() {
	return (
		<div className="mx-auto max-w-3xl">
			<div className="h-4 w-32 animate-pulse rounded bg-surface-container" />

			<div className="mt-6">
				<div className="flex items-center gap-3">
					<div className="h-7 w-64 animate-pulse rounded bg-surface-container" />
					<div className="h-6 w-16 animate-pulse rounded-full bg-surface-container" />
				</div>
				<div className="mt-2 h-4 w-48 animate-pulse rounded bg-surface-container" />
			</div>

			<div className="mt-6 flex gap-2">
				<div className="h-9 w-24 animate-pulse rounded-xl bg-surface-container" />
				<div className="h-9 w-24 animate-pulse rounded-xl bg-surface-container" />
			</div>

			<div className="my-6 h-px bg-outline-variant/10" />

			<div className="h-5 w-16 animate-pulse rounded bg-surface-container" />
			<div className="mt-3 rounded-xl bg-surface-container p-4">
				<div className="h-4 w-full animate-pulse rounded bg-surface-container-high" />
				<div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-surface-container-high" />
				<div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-surface-container-high" />
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<div className="rounded-xl bg-surface-container p-3">
					<div className="h-3 w-12 animate-pulse rounded bg-surface-container-high" />
					<div className="mt-1.5 h-4 w-20 animate-pulse rounded bg-surface-container-high" />
				</div>
				<div className="rounded-xl bg-surface-container p-3">
					<div className="h-3 w-12 animate-pulse rounded bg-surface-container-high" />
					<div className="mt-1.5 h-4 w-24 animate-pulse rounded bg-surface-container-high" />
				</div>
			</div>
		</div>
	)
}
