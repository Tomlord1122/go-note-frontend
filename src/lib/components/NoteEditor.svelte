<script lang="ts">
	import RealtimeMarkdownEditor from './RealtimeMarkdownEditor.svelte';

	interface Props {
		title: string;
		content: string;
		tags: string;
		isPublic: boolean;
		loading: boolean;
		isEditing: boolean;
		onSave: () => void;
		onCancel: () => void;
		onTitleChange: (value: string) => void;
		onContentChange: (value: string) => void;
		onTagsChange: (value: string) => void;
		onPublicChange: (value: boolean) => void;
	}

	let {
		title,
		content,
		tags,
		isPublic,
		loading,
		isEditing,
		onSave,
		onCancel,
		onTitleChange,
		onContentChange,
		onTagsChange,
		onPublicChange
	}: Props = $props();

	// Remove old preview mode logic since it's now handled by the RealtimeMarkdownEditor
</script>

<!-- Mobile-Responsive Note Editor -->
<div class="w-full">
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onSave();
		}}
		class="w-full max-w-full rounded-lg border border-gray-300 bg-white p-4 shadow-sm md:p-6 lg:p-8"
	>
		<div class="space-y-4 md:space-y-6">
			<!-- Title Input -->
			<div>
				<label for="note-title" class="mb-2 block text-sm font-medium text-gray-700">
					Note Title
				</label>
				<input
					value={title}
					oninput={(e) => onTitleChange((e.target as HTMLInputElement).value)}
					type="text"
					id="note-title"
					placeholder="Enter note title..."
					required
					class="w-full rounded-md border-gray-300 px-3 py-2 font-serif text-base text-gray-900 shadow-sm focus:border-gray-500 focus:ring-gray-500 md:px-4 md:py-3 md:text-lg"
				/>
			</div>

			<!-- Real-time Markdown Editor -->
			<div>
				<div class="mb-2 text-sm font-medium text-gray-700">Note Content (Markdown supported)</div>
				<RealtimeMarkdownEditor
					{content}
					{onContentChange}
					placeholder="Start writing your thoughts... (You can use Markdown syntax)"
					minHeight="400px"
					showToolbar={true}
				/>
			</div>

			<!-- Tags and Settings - Stack on Mobile -->
			<div class="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
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
				<div class="flex items-center">
					<label class="flex cursor-pointer items-center">
						<input
							checked={isPublic}
							onchange={(e) => onPublicChange((e.target as HTMLInputElement).checked)}
							type="checkbox"
							class="h-4 w-4 rounded border-gray-300 text-gray-600 shadow-sm focus:ring-gray-500"
						/>
						<span class="ml-3 text-sm font-medium text-gray-700">Public Note</span>
					</label>
				</div>
			</div>
		</div>

		<!-- Mobile-Optimized Form Action Buttons -->
		<footer class="mt-6 border-t border-gray-300 pt-4 md:mt-8 md:pt-6">
			<div class="flex flex-col gap-3 md:flex-row md:justify-end">
				<button
					type="button"
					onclick={onCancel}
					disabled={loading}
					class="inline-flex items-center justify-center rounded-md bg-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:opacity-50 md:order-1 md:px-6 md:py-2"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading}
					class="inline-flex items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400 md:order-2 md:px-6 md:py-2"
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
						Saving...
					{:else}
						{isEditing ? 'Update Note' : 'Create Note'}
					{/if}
				</button>
			</div>
		</footer>
	</form>
</div>
