<script lang="ts">
	interface Props {
		message: string | null;
		type: 'success' | 'error';
		onClose: () => void;
	}

	let { message, type, onClose }: Props = $props();
</script>

{#if message}
	<!-- Mobile-Responsive Toast -->
	<div
		class="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-sm rounded-md border {type === 'error'
			? 'border-gray-400 bg-gray-100'
			: 'border-gray-300 bg-gray-50'} p-3 shadow-xl md:right-4 md:left-auto md:max-w-md md:p-4"
		role="alert"
		aria-live="polite"
	>
		<div class="flex items-start">
			{#if type === 'error'}
				<svg
					class="h-5 w-5 flex-shrink-0 text-gray-700"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
			{:else}
				<svg
					class="h-5 w-5 flex-shrink-0 text-gray-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
					></path>
				</svg>
			{/if}
			<div class="ml-3 min-w-0 flex-1">
				<p
					class="text-sm font-medium {type === 'error'
						? 'text-gray-800'
						: 'text-gray-700'} break-words"
				>
					{message}
				</p>
				<button
					onclick={onClose}
					class="mt-2 text-xs text-gray-600 hover:text-gray-500 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
				>
					Close
				</button>
			</div>
			<!-- Mobile Close Button -->
			<button
				onclick={onClose}
				class="ml-2 rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none md:hidden"
				aria-label="Close notification"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>
	</div>
{/if}
