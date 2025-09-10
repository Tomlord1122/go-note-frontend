<script lang="ts">
	import type { Note } from '$lib/api.js';
	import NotesFilter from './NotesFilter.svelte';
	import { getTimeDisplayText } from '$lib/utils/dateFormat.js';

	interface Props {
		notes: Note[];
		onEditNote: (note: Note) => void;
		onDeleteNote: (note: Note) => void;
		onCreateNote: () => void;
		onFilteredCountChange?: (count: number) => void;
	}

	let { notes, onEditNote, onDeleteNote, onCreateNote, onFilteredCountChange }: Props = $props();

	// 過濾和排序狀態
	let selectedTags = $state<string[]>([]);
	let sortOrder = $state<'newest' | 'oldest' | 'title'>('newest');
	let searchQuery = $state('');

	// 過濾和排序筆記
	let filteredAndSortedNotes: Note[] = $derived(
		notes
			.filter(
				(note) =>
					note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
					note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
			)
			.filter((note) => selectedTags.every((tag) => note.tags.includes(tag)))
			.sort((a, b) => {
				if (sortOrder === 'newest') {
					return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
				} else if (sortOrder === 'oldest') {
					return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
				} else if (sortOrder === 'title') {
					return a.title.localeCompare(b.title, 'zh-TW');
				}
				return 0;
			})
	);

	// 當過濾後的筆記數量改變時通知父組件
	$effect(() => {
		if (onFilteredCountChange) {
			onFilteredCountChange(filteredAndSortedNotes.length);
		}
	});

	// 清除所有過濾器
	function clearFilters() {
		selectedTags = [];
		sortOrder = 'newest';
		searchQuery = '';
	}
</script>

{#if notes && notes.length > 0}
	<!-- 過濾器和排序控制 -->
	<NotesFilter
		{notes}
		{selectedTags}
		{sortOrder}
		{searchQuery}
		onTagsChange={(tags) => (selectedTags = tags)}
		onSortChange={(sort) => (sortOrder = sort)}
		onSearchChange={(query) => (searchQuery = query)}
		onClearFilters={clearFilters}
	/>

	<!-- 筆記網格 -->
	{#if filteredAndSortedNotes.length > 0}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredAndSortedNotes as note (note.id)}
				<article
					class="rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-transform duration-200 hover:scale-105 hover:shadow-md"
				>
					<header class="mb-3 flex items-start justify-between">
						<h2 class="font-serif text-lg leading-tight font-semibold text-gray-900">
							{note.title}
						</h2>
						<div class="ml-2 flex items-center gap-1">
							{#if note.is_public}
								<span
									class="inline-flex items-center rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700"
									aria-label="公開筆記"
								>
									公開
								</span>
							{/if}
						</div>
					</header>

					<div class="prose prose-sm mb-4 font-serif text-gray-800">
						<p class="line-clamp-3">{note.content}</p>
					</div>

					{#if note.tags.length > 0}
						<div class="mb-4 flex flex-wrap gap-1" role="list" aria-label="標籤">
							{#each note.tags as tag (tag)}
								<span
									class="inline-flex items-center rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700"
									role="listitem"
								>
									#{tag}
								</span>
							{/each}
						</div>
					{/if}

					<footer class="flex items-center justify-between border-t border-gray-200 pt-4">
						{#snippet timeDisplay()}
							{@const timeInfo = getTimeDisplayText(note.created_at, note.updated_at)}
							<div class="text-xs text-gray-500">
								<time datetime={note.updated_at}>{timeInfo.primary}</time>
								{#if timeInfo.secondary}
									<div class="mt-1 text-xs text-gray-400">{timeInfo.secondary}</div>
								{/if}
							</div>
						{/snippet}

						{@render timeDisplay()}
						<div class="flex gap-2">
							<button
								onclick={() => onEditNote(note)}
								class="inline-flex items-center justify-center rounded-md bg-gray-200 p-2 text-gray-700 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
								aria-label="編輯筆記"
								title="編輯"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									></path>
								</svg>
							</button>
							<button
								onclick={() => onDeleteNote(note)}
								class="inline-flex items-center justify-center rounded-md bg-gray-200 p-2 text-gray-700 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
								aria-label="刪除筆記"
								title="刪除"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									></path>
								</svg>
							</button>
						</div>
					</footer>
				</article>
			{/each}
		</div>
	{:else}
		<!-- 沒有符合過濾條件的筆記 -->
		<div class="py-12 text-center">
			<svg
				class="mx-auto mb-4 h-12 w-12 text-gray-400"
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
			<h3 class="mb-2 font-serif text-lg font-medium text-gray-900">沒有找到符合條件的筆記</h3>
			<p class="mb-4 text-gray-600">嘗試調整過濾條件或清除所有過濾器</p>
			<button
				onclick={clearFilters}
				class="inline-flex items-center justify-center rounded-md bg-gray-200 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
			>
				清除過濾器
			</button>
		</div>
	{/if}
{:else}
	<!-- 空狀態 -->
	<div class="py-20 text-center">
		<svg
			class="mx-auto mb-6 h-16 w-16 text-gray-400"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
			></path>
		</svg>
		<h2 class="mb-2 font-serif text-xl font-medium text-gray-900">還沒有筆記</h2>
		<p class="mb-6 text-gray-600">開始創建你的第一篇筆記吧！</p>
		<button
			onclick={onCreateNote}
			class="inline-flex items-center justify-center rounded-md bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
		>
			<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
				></path>
			</svg>
			創建第一篇筆記
		</button>
	</div>
{/if}
