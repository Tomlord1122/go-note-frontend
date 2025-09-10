<script lang="ts">
	interface Props {
		message: string | null;
		type: 'success' | 'error';
		onClose: () => void;
	}

	let { message, type, onClose }: Props = $props();
</script>

{#if message}
	<div
		class="fixed right-4 bottom-4 z-50 rounded-md border {type === 'error'
			? 'border-gray-400 bg-gray-100'
			: 'border-gray-300 bg-gray-50'} p-4 shadow-xl"
		role="alert"
		aria-live="polite"
	>
		<div class="flex">
			{#if type === 'error'}
				<svg class="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
			{:else}
				<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
					></path>
				</svg>
			{/if}
			<div class="ml-3">
				<p class="text-sm font-medium {type === 'error' ? 'text-gray-800' : 'text-gray-700'}">
					{message}
				</p>
				<button
					onclick={onClose}
					class="mt-2 text-xs text-gray-600 hover:text-gray-500 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
