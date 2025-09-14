<script lang="ts">
	import { onMount } from 'svelte';
	import NotionLikeEditor from './NotionLikeEditor.svelte';

	interface Props {
		title: string;
		content: string;
		tags: string;
		saveStatus: 'saved' | 'saving' | 'error';
		autoFocus?: boolean;
		onCancel: () => void;
		onTitleChange: (value: string) => void;
		onContentChange: (value: string) => void;
		onTagsChange: (value: string) => void;
	}

	let {
		title,
		content,
		tags,
		saveStatus,
		autoFocus = false,
		onCancel,
		onTitleChange,
		onContentChange,
		onTagsChange
	}: Props = $props();

	let titleInputRef: HTMLInputElement;

	// Auto-focus title input for new notes
	onMount(() => {
		// Focus title input if autoFocus is enabled or if it's empty (new note)
		if ((autoFocus || !title.trim()) && titleInputRef) {
			// Small delay to ensure DOM is ready
			setTimeout(() => {
				titleInputRef.focus();
			}, 100);
		}
	});
</script>

<!-- Mobile-Responsive Note Editor -->
<div class="w-full">
	<div
		class="w-full max-w-full rounded-lg border border-gray-300 bg-white p-4 shadow-sm md:p-6 lg:p-8"
	>
		<div class="space-y-4 md:space-y-6">
			<!-- Title Input -->
			<div>
				<label for="note-title" class="mb-2 block text-sm font-medium text-gray-700">
					Note Title
				</label>
				<input
					bind:this={titleInputRef}
					value={title}
					oninput={(e) => onTitleChange((e.target as HTMLInputElement).value)}
					type="text"
					id="note-title"
					placeholder="Enter note title..."
					required
					class="w-full rounded-md border-gray-300 px-3 py-2 font-serif text-base text-gray-900 shadow-sm focus:border-gray-500 focus:ring-gray-500 md:px-4 md:py-3 md:text-lg"
				/>
			</div>

			<!-- Notion-like WYSIWYG Editor -->
			<div>
				<div class="mb-2 flex items-center justify-between">
					<div class="text-sm font-medium text-gray-700">
						Note Content (Type '/' for commands)
					</div>
					
				</div>
				<div class="rounded-lg border border-gray-300 bg-white shadow-sm">
					<NotionLikeEditor
						{content}
						{onContentChange}
						placeholder="Type '/' for commands or start writing..."
						minHeight="400px"
					/>
				</div>
			</div>

			<!-- Tags -->
			<div>
				<label for="note-tags" class="mb-2 block text-sm font-medium text-gray-700">Tags</label>
				<input
					value={tags}
					oninput={(e) => onTagsChange((e.target as HTMLInputElement).value)}
					type="text"
					id="note-tags"
					placeholder="work, important, ideas"
					class="w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:ring-gray-500 md:px-4 md:py-3"
				/>
				<p class="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
			</div>
		</div>

		<!-- Save Status and Actions -->
		<footer class="mt-6 border-t border-gray-300 pt-4 md:mt-8 md:pt-6">
			
			<div class="flex items-center justify-between">
				<!-- Save Status Indicator -->
				<div class="flex items-center gap-2">
					{#if saveStatus === 'saving'}
						<svg class="h-4 w-4 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
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
						<span class="text-sm text-gray-600">Saving...</span>
					{:else if saveStatus === 'saved'}
						<svg
							class="h-4 w-4 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-sm text-green-600">Saved</span>
					{:else if saveStatus === 'error'}
						<svg class="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						<span class="text-sm text-red-600">Save failed</span>
					{/if}
				</div>

				<!-- Back Button -->
				<button
					type="button"
					onclick={onCancel}
					class="inline-flex items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						></path>
					</svg>
					Back to Notes
				</button>
			</div>
		</footer>
	</div>
</div>
