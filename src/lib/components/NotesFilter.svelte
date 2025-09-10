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

	// 從所有筆記中提取唯一標籤
	let allTags: string[] = $derived(() => {
		const tagsArray: string[] = [];
		notes.forEach((note) => {
			note.tags.forEach((tag) => {
				if (!tagsArray.includes(tag)) {
					tagsArray.push(tag);
				}
			});
		});
		return tagsArray.sort();
	});

	// 切換標籤選擇
	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			onTagsChange(selectedTags.filter((t) => t !== tag));
		} else {
			onTagsChange([...selectedTags, tag]);
		}
	}

	// 檢查是否有活躍的過濾器
	let hasActiveFilters: boolean = $derived(
		() => selectedTags.length > 0 || sortOrder !== 'newest' || searchQuery.trim() !== ''
	);
</script>

<!-- 過濾器和排序控制 -->
<div class="mb-6 rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
	<!-- 搜索欄 -->
	<div class="mb-4">
		<label for="search-input" class="mb-2 block text-sm font-medium text-gray-700">搜索筆記</label>
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
				placeholder="搜索標題或內容..."
				class="w-full rounded-md border-gray-300 py-2 pr-4 pl-10 text-sm shadow-sm focus:border-gray-500 focus:ring-gray-500"
			/>
			{#if searchQuery.trim() !== ''}
				<button
					onclick={() => onSearchChange('')}
					class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
					aria-label="清除搜索"
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
		<!-- 排序控制 -->
		<div class="flex items-center gap-2">
			<label for="sort-select" class="text-sm font-medium text-gray-700">排序:</label>
			<select
				id="sort-select"
				value={sortOrder}
				onchange={(e) =>
					onSortChange((e.target as HTMLSelectElement).value as 'newest' | 'oldest' | 'title')}
				class="rounded-md border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-gray-500 focus:ring-gray-500"
			>
				<option value="newest">最新優先</option>
				<option value="oldest">最舊優先</option>
				<option value="title">按標題排序</option>
			</select>
		</div>

		<!-- 清除過濾器按鈕 -->
		{#if hasActiveFilters}
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
				清除過濾器
			</button>
		{/if}
	</div>

	<!-- 標籤過濾器 -->
	{#if allTags.length > 0}
		<div class="mt-4 border-t border-gray-200 pt-4">
			<p class="mb-2 text-sm font-medium text-gray-700">按標籤過濾:</p>
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

	<!-- 過濾器狀態顯示 -->
	{#if selectedTags.length > 0 || searchQuery.trim() !== ''}
		<div class="mt-3 text-xs text-gray-600">
			{#if searchQuery.trim() !== ''}
				<span>搜索: "{searchQuery}"</span>
				{#if selectedTags.length > 0}
					<span class="mx-2">•</span>
				{/if}
			{/if}
			{#if selectedTags.length > 0}
				<span>已選擇 {selectedTags.length} 個標籤: {selectedTags.join(', ')}</span>
			{/if}
		</div>
	{/if}
</div>
