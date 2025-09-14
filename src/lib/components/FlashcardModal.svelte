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
	<!-- Mobile-Responsive Modal -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-end justify-center bg-black p-4 md:items-center"
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
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="w-full max-w-2xl rounded-t-lg border border-gray-300 bg-white shadow-xl md:max-w-4xl md:rounded-lg"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Header -->
			<header class="flex items-center justify-between border-b border-gray-200 p-4 md:p-6">
				<div class="flex items-center gap-2">
					{#if flashcard.difficulty}
						<span
							class="rounded-full px-2 py-1 text-xs font-medium {flashcard.difficulty === 'Easy'
								? 'bg-green-100 text-green-800'
								: flashcard.difficulty === 'Hard'
									? 'bg-red-100 text-red-800'
									: 'bg-yellow-100 text-yellow-800'} md:px-3"
						>
							{flashcard.difficulty}
						</span>
					{/if}
					<h2
						id="flashcard-title"
						class="font-serif text-lg font-semibold text-gray-900 md:text-xl"
					>
						Learning Flashcard
					</h2>
				</div>
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
			</header>

			<!-- Content with Mobile-Optimized Scrolling -->
			<div class="scrollbar-stable max-h-[60vh] overflow-y-auto p-4 md:max-h-[70vh] md:p-8">
				<div class="space-y-6 md:space-y-8">
					<!-- Answer -->
					<div>
						<h3 class="mb-3 font-serif text-lg font-semibold text-gray-900 md:mb-4 md:text-xl">
							Answer
						</h3>
						<div class="rounded-lg bg-green-50 p-4 md:p-6">
							<div class="prose prose-sm md:prose-lg font-serif text-gray-800">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html renderMarkdown(flashcard.answer)}
							</div>
						</div>
					</div>

					<!-- Explanation -->
					{#if flashcard.explanation}
						<div>
							<h3 class="mb-3 font-serif text-lg font-semibold text-gray-900 md:mb-4 md:text-xl">
								Detailed Explanation
							</h3>
							<div class="rounded-lg bg-gray-50 p-4 md:p-6">
								<div class="prose prose-sm md:prose-lg font-serif text-gray-700">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html renderMarkdown(flashcard.explanation)}
								</div>
							</div>
						</div>
					{/if}

					<!-- Tags -->
					{#if flashcard.tags && flashcard.tags.length > 0}
						<div>
							<h3 class="mb-2 font-serif text-sm font-medium text-gray-700 md:text-base">
								Related Tags
							</h3>
							<div class="flex flex-wrap gap-2">
								{#each flashcard.tags as tag (tag)}
									<span class="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
										#{tag}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Mobile-Optimized Footer -->
			<footer
				class="border-t border-gray-200 p-4 md:flex md:items-center md:justify-between md:p-6"
			>
				<div class="flex flex-col gap-3 md:flex-row md:gap-4">
					<button
						onclick={copyQAContent}
						class="inline-flex items-center justify-center rounded-md bg-gray-700 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400 md:py-2"
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
						class="inline-flex items-center justify-center rounded-md bg-gray-200 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none md:py-2"
					>
						Close
					</button>
				</div>
			</footer>
		</div>
	</div>
{/if}
