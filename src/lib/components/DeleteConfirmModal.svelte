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
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={onCancel}
		onkeydown={(e) => e.key === 'Escape' && onCancel()}
		role="dialog"
		aria-labelledby="delete-title"
		aria-describedby="delete-description"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="mx-4 w-full max-w-md rounded-lg border border-gray-300 bg-white p-6 shadow-xl"
			role="document"
		>
			<header class="mb-4 flex items-center">
				<svg
					class="mr-3 h-6 w-6 text-gray-700"
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
				<h2 id="delete-title" class="font-serif text-lg font-semibold text-gray-900">確認刪除</h2>
			</header>

			<div class="prose prose-sm mb-6 font-serif text-gray-700">
				<p id="delete-description">
					你確定要刪除筆記「<span class="font-medium">{note.title}</span>」嗎？此操作無法撤銷。
				</p>
			</div>

			<footer class="flex justify-end gap-3">
				<button
					onclick={onCancel}
					disabled={loading}
					class="inline-flex items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:opacity-50"
				>
					取消
				</button>
				<button
					onclick={() => onConfirm(note)}
					disabled={loading}
					class="inline-flex items-center justify-center rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
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
						刪除中...
					{:else}
						確認刪除
					{/if}
				</button>
			</footer>
		</div>
	</div>
{/if}
