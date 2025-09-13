<script lang="ts">
	import type { SearchNotesItem } from '$lib/api.js';
	import { api } from '$lib/api.js';

	interface Props {
		onUseNotes?: (noteIds: string[]) => void;
	}

	let { onUseNotes }: Props = $props();

	let query = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let results = $state<SearchNotesItem[]>([]);
	let selected = $state<Record<string, boolean>>({});

	async function runSearch() {
		if (!query.trim()) {
			error = 'Please enter search text';
			return;
		}
		loading = true;
		error = null;
		results = [];
		selected = {};
		const res = await api.searchNotes(query, 0.7, 10);
		if (res.data) {
			results = (res.data as { notes: SearchNotesItem[] }).notes || [];
		} else {
			error = res.error || 'Search failed';
			results = [];
		}
		loading = false;
	}

	function useSelected() {
		const ids = (results || []).filter((n) => selected[n.id]).map((n) => n.id);
		if (ids.length === 0) {
			error = 'Please select at least one note';
			return;
		}
		onUseNotes?.(ids);
		// Clear selection state and show success message
		selected = {};
		error = `Selected ${ids.length} notes, please generate flashcards below`;
		setTimeout(() => {
			error = null;
		}, 3000);
	}
</script>

<!-- Mobile-Responsive Semantic Search -->
<div class="rounded-lg border border-gray-300 bg-white p-3 shadow-sm md:p-4">
	<h3 class="mb-3 font-serif text-base font-semibold text-gray-900 md:text-lg">Semantic Search</h3>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			runSearch();
		}}
		class="mb-3 space-y-3 md:flex md:gap-2 md:space-y-0"
	>
		<input
			id="semantic-query"
			value={query}
			oninput={(e) => (query = (e.target as HTMLInputElement).value)}
			placeholder="Enter query text, e.g.: Neural Networks"
			class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-gray-500 md:flex-1"
			aria-label="Semantic search input"
		/>
		<button
			type="submit"
			class="w-full rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400 md:w-auto"
			disabled={loading}
		>
			{loading ? 'Searching...' : 'Search'}
		</button>
	</form>

	{#if error}
		<p class="mb-2 text-sm text-gray-700">{error}</p>
	{/if}

	{#if results && results.length > 0}
		<div class="mb-3 text-xs text-gray-500">
			Found {results.length} results (select to generate flashcards)
		</div>
		<ul class="space-y-2 md:space-y-3">
			{#each results as n (n.id)}
				<li class="rounded-md border border-gray-200 p-3">
					<label class="flex items-start gap-2 md:gap-3">
						<input
							type="checkbox"
							checked={!!selected[n.id]}
							onchange={(e) => (selected[n.id] = (e.target as HTMLInputElement).checked)}
							class="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-gray-600 focus:ring-gray-600"
							aria-label={`Select ${n.title}`}
						/>
						<div class="min-w-0 flex-1">
							<div class="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
								<h4 class="font-serif text-sm font-semibold break-words text-gray-900">
									{n.title}
								</h4>
								<span class="flex-shrink-0 text-xs text-gray-500">
									Similarity {(n.similarity ?? 0).toFixed(2)}
								</span>
							</div>
							<p class="prose prose-sm mt-1 line-clamp-2 font-serif text-gray-700">{n.content}</p>
							{#if n.tags?.length}
								<div class="mt-2 flex flex-wrap gap-1">
									{#each n.tags as t (t)}
										<span class="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700">
											#{t}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</label>
				</li>
			{/each}
		</ul>
		<div class="mt-4">
			<button
				onclick={useSelected}
				class="w-full rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none md:w-auto"
			>
				Generate flashcards from selected notes
			</button>
		</div>
	{/if}
</div>
