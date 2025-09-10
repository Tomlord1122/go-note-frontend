<script lang="ts">
	import type { Flashcard } from '$lib/api.js';
	import { renderMarkdown } from '$lib/utils/markdown.js';

	interface Props {
		show: boolean;
		flashcard: Flashcard | null;
		onClose: () => void;
	}

	let { show, flashcard, onClose }: Props = $props();

	let copySuccess = $state(false);

	function generateSimpleQA(): string {
		if (!flashcard) return '';

		let content = `${flashcard.answer}`;

		if (flashcard.explanation) {
			content += `\n\nExplanation: ${flashcard.explanation}`;
		}

		return content;
	}

	async function copyQAContent() {
		if (!flashcard) return;

		try {
			const content = generateSimpleQA();
			await navigator.clipboard.writeText(content);
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if show && flashcard}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		}}
		onkeydown={handleKeydown}
		role="dialog"
		aria-labelledby="flashcard-title"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="mx-4 w-full max-w-4xl rounded-lg border border-gray-300 bg-white shadow-xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Header -->
			<header class="flex items-center justify-between border-b border-gray-200 p-6">
				<div class="flex items-center gap-2">
					{#if flashcard.difficulty}
						<span
							class="rounded-full px-3 py-1 text-xs font-medium {flashcard.difficulty === 'Easy'
								? 'bg-green-100 text-green-800'
								: flashcard.difficulty === 'Hard'
									? 'bg-red-100 text-red-800'
									: 'bg-yellow-100 text-yellow-800'}"
						>
							{flashcard.difficulty}
						</span>
					{/if}
					<button
						onclick={onClose}
						class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
						aria-label="Close"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>
			</header>

			<!-- Content -->
			<div class="max-h-[70vh] overflow-y-auto p-8">
				<div class="space-y-8">
					<!-- Answer -->
					<div>
						<h3 class="mb-4 font-serif text-xl font-semibold text-gray-900">Answer</h3>
						<div class="rounded-lg bg-green-50 p-6">
							<div class="prose prose-lg font-serif text-gray-800">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html renderMarkdown(flashcard.answer)}
							</div>
						</div>
					</div>

					<!-- Explanation -->
					{#if flashcard.explanation}
						<div>
							<h3 class="mb-4 font-serif text-xl font-semibold text-gray-900">
								Detailed Explanation
							</h3>
							<div class="rounded-lg bg-gray-50 p-6">
								<div class="prose prose-lg font-serif text-gray-700">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html renderMarkdown(flashcard.explanation)}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<footer class="flex items-center justify-between border-t border-gray-200 p-6">
				<button
					onclick={copyQAContent}
					class="inline-flex items-center rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						></path>
					</svg>
					{copySuccess ? 'Copied!' : 'Copy Q&A Content'}
				</button>

				<button
					onclick={onClose}
					class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
				>
					Close
				</button>
			</footer>
		</div>
	</div>
{/if}
