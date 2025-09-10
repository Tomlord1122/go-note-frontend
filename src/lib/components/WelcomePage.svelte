<script lang="ts">
	interface Props {
		apiStatus: 'checking' | 'online' | 'offline' | 'error';
	}

	let { apiStatus }: Props = $props();
</script>

<!-- Welcome page for non-logged users -->
<div class="flex flex-1 items-center justify-center">
	<div class="container mx-auto px-4 text-center lg:max-w-screen-md">
		<svg
			class="mx-auto mb-8 h-24 w-24 text-gray-400"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
			></path>
		</svg>
		<h1 class="mb-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">Welcome to Go Note</h1>
		<div class="prose prose-sm sm:prose-base mx-auto mb-8 font-serif text-gray-700">
			<p>
				A modern note-taking application built with Go and Supabase, featuring Google OAuth login
				and real-time sync.
			</p>
		</div>

		{#if apiStatus !== 'online'}
			<div class="mx-auto mb-6 max-w-md rounded-md border border-gray-400 bg-gray-100 p-4">
				<div class="flex">
					<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-gray-800">API Service Not Running</h3>
						<p class="mt-1 text-sm text-gray-700">
							Please ensure the Go API server is running.
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
