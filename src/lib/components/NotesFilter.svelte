<script lang="ts">
	import type { Note } from '$lib/api.js';

	interface Props {
		notes: Note[];
		selectedTags: string[];
		sortOrder: 'newest' | 'oldest' | 'title';
		searchQuery: string;
		onTagsChange: (tags: string[]) => void;
		onSortChange: (sort: 'newest' | 'oldest' | 'title') => void;
		onSearchChange: (query: string) => void;
		onClearFilters: () => void;
	}

	let {
		notes,
		selectedTags,
		sortOrder,
		searchQuery,
		onTagsChange,
		onSortChange,
		onSearchChange,
		onClearFilters
	}: Props = $props();

	let allTags: string[] = $derived(
		notes
			.flatMap((note) => note.tags)
			.filter((tag, index, self) => self.indexOf(tag) === index)
			.sort()
	);

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			onTagsChange(selectedTags.filter((t) => t !== tag));
		} else {
			onTagsChange([...selectedTags, tag]);
		}
	}

	let hasActiveFilters = $derived(
		() => selectedTags.length > 0 || sortOrder !== 'newest' || searchQuery.trim() !== ''
	);
</script>

<div class="mb-6 rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
	<div class="mb-4">
		<label for="search-input" class="mb-2 block text-sm font-medium text-gray-700"
			>Search notes</label
		>
		<div class="relative">
			<svg
				class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				></path>
			</svg>
			<input
				id="search-input"
				type="text"
				value={searchQuery}
				oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
				placeholder="Search title or content..."
				class="w-full rounded-md border-gray-300 py-2 pr-4 pl-10 text-sm shadow-sm focus:border-gray-500 focus:ring-gray-500"
			/>
			{#if searchQuery.trim() !== ''}
				<button
					onclick={() => onSearchChange('')}
					class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
					aria-label="Clear search"
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
			{/if}
		</div>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-2">
			<label for="sort-select" class="text-sm font-medium text-gray-700">Sort by:</label>
			<select
				id="sort-select"
				value={sortOrder}
				onchange={(e) =>
					onSortChange((e.target as HTMLSelectElement).value as 'newest' | 'oldest' | 'title')}
				class="rounded-md border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-gray-500 focus:ring-gray-500"
			>
				<option value="newest">Newest first</option>
				<option value="oldest">Oldest first</option>
				<option value="title">Sort by title</option>
			</select>
		</div>

		{#if hasActiveFilters()}
			<button
				onclick={onClearFilters}
				class="inline-flex items-center justify-center rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
			>
				<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
				Clear filters
			</button>
		{/if}
	</div>

	{#if allTags.length > 0}
		<div class="mt-4 border-t border-gray-200 pt-4">
			<label for="tag-select" class="mb-2 block text-sm font-medium text-gray-700"
				>Filter by tags:</label
			>
			<div class="flex flex-wrap gap-2">
				{#each allTags as tag (tag)}
					<button
						onclick={() => toggleTag(tag)}
						class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedTags.includes(
							tag
						)
							? 'bg-gray-700 text-white'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'} focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
						aria-pressed={selectedTags.includes(tag)}
					>
						#{tag}
						{#if selectedTags.includes(tag)}
							<svg class="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mt-3 text-xs text-gray-600">
		{#if selectedTags.length > 0 || searchQuery.trim() !== ''}
			{#if searchQuery.trim() !== ''}
				<span>Search: "{searchQuery}"</span>
				{#if selectedTags.length > 0}
					<span class="mx-2">•</span>
				{/if}
			{/if}
			{#if selectedTags.length > 0}
				<span>Selected {selectedTags.length} tags: {selectedTags.join(', ')}</span>
			{/if}
		{:else}
			<span>No tags selected</span>
		{/if}
	</div>
</div>
