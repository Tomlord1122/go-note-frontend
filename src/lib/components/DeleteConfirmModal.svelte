<script lang="ts">
	import type { Note } from '$lib/api.js';

	interface Props {
		show: boolean;
		note: Note | null;
		loading: boolean;
		onConfirm: (note: Note) => void;
		onCancel: () => void;
	}

	let { show, note, loading, onConfirm, onCancel }: Props = $props();
</script>

{#if show && note}
	<!-- Mobile-Responsive Delete Confirmation Modal -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-end justify-center bg-black p-4 md:items-center"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				onCancel();
			}
		}}
		onkeydown={(e) => e.key === 'Escape' && onCancel()}
		role="dialog"
		aria-labelledby="delete-title"
		aria-describedby="delete-description"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="w-full max-w-md rounded-t-lg border border-gray-300 bg-white p-4 shadow-xl md:rounded-lg md:p-6"
			role="document"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<header class="mb-4 flex items-center">
				<svg
					class="mr-3 h-5 w-5 text-gray-700 md:h-6 md:w-6"
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
				<h2 id="delete-title" class="font-serif text-base font-semibold text-gray-900 md:text-lg">
					Confirm deletion
				</h2>
			</header>

			<div class="prose prose-sm mb-4 font-serif text-gray-700 md:mb-6">
				<p id="delete-description">
					Are you sure you want to delete the note "<span class="font-medium">{note.title}</span>"?
					This action cannot be undone.
				</p>
			</div>

			<!-- Mobile-Optimized Footer -->
			<footer class="flex flex-col gap-3 md:flex-row md:justify-end">
				<button
					onclick={onCancel}
					disabled={loading}
					class="inline-flex items-center justify-center rounded-md bg-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:opacity-50 md:order-1 md:py-2"
				>
					Cancel
				</button>
				<button
					onclick={() => onConfirm(note)}
					disabled={loading}
					class="inline-flex items-center justify-center rounded-md bg-gray-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400 md:order-2 md:py-2"
				>
					{#if loading}
						<svg class="mr-2 -ml-1 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Deleting...
					{:else}
						Confirm deletion
					{/if}
				</button>
			</footer>
		</div>
	</div>
{/if}
