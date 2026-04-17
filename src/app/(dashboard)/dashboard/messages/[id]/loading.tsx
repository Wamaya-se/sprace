export default function ConversationLoading() {
	return (
		<div className="mx-auto flex max-w-3xl flex-col">
			<div className="h-4 w-28 animate-pulse rounded bg-surface-container" />

			<div className="mt-4">
				<div className="h-6 w-48 animate-pulse rounded bg-surface-container" />
			</div>

			<div className="mt-6 flex min-h-[300px] flex-col gap-3 rounded-xl bg-surface-container p-4">
				<div className="my-3 flex items-center gap-3">
					<div className="h-px flex-1 bg-outline-variant/10" />
					<div className="h-3 w-12 animate-pulse rounded bg-surface-container-high" />
					<div className="h-px flex-1 bg-outline-variant/10" />
				</div>

				<div className="flex justify-start">
					<div className="h-16 w-3/5 animate-pulse rounded-2xl bg-surface-container-high" />
				</div>
				<div className="flex justify-end">
					<div className="h-12 w-2/5 animate-pulse rounded-2xl bg-surface-container-high" />
				</div>
				<div className="flex justify-start">
					<div className="h-20 w-1/2 animate-pulse rounded-2xl bg-surface-container-high" />
				</div>
				<div className="flex justify-end">
					<div className="h-12 w-3/5 animate-pulse rounded-2xl bg-surface-container-high" />
				</div>
			</div>

			<div className="mt-4 flex gap-2">
				<div className="h-11 flex-1 animate-pulse rounded-xl bg-surface-container" />
				<div className="h-11 w-20 animate-pulse rounded-xl bg-surface-container" />
			</div>
		</div>
	)
}
