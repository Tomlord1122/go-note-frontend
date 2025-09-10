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
			error = '請輸入搜尋文字';
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
			error = res.error || '搜尋失敗';
			results = [];
		}
		loading = false;
	}

	function useSelected() {
		const ids = (results || []).filter((n) => selected[n.id]).map((n) => n.id);
		if (ids.length === 0) {
			error = '請至少選擇一個筆記';
			return;
		}
		onUseNotes?.(ids);
		// 清除選擇狀態並顯示成功訊息
		selected = {};
		error = `已選擇 ${ids.length} 個筆記，請到下方生成閃卡`;
		setTimeout(() => {
			error = null;
		}, 3000);
	}
</script>

<div class="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
	<h3 class="mb-3 font-serif text-lg font-semibold text-gray-900">語義搜尋</h3>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			runSearch();
		}}
		class="mb-3 flex gap-2"
	>
		<input
			id="semantic-query"
			value={query}
			oninput={(e) => (query = (e.target as HTMLInputElement).value)}
			placeholder="輸入查詢文字，例如：Neural Networks"
			class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-gray-500"
			aria-label="語義搜尋輸入"
		/>
		<button
			type="submit"
			class="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
			disabled={loading}
		>
			{loading ? '搜尋中...' : '搜尋'}
		</button>
	</form>

	{#if error}
		<p class="mb-2 text-sm text-gray-700">{error}</p>
	{/if}

	{#if results && results.length > 0}
		<div class="mb-3 text-xs text-gray-500">找到 {results.length} 筆結果（勾選後可生成閃卡）</div>
		<ul class="space-y-3">
			{#each results as n (n.id)}
				<li class="rounded-md border border-gray-200 p-3">
					<label class="flex items-start gap-3">
						<input
							type="checkbox"
							checked={!!selected[n.id]}
							onchange={(e) => (selected[n.id] = (e.target as HTMLInputElement).checked)}
							class="mt-1 h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-600"
							aria-label={`選擇 ${n.title}`}
						/>
						<div>
							<div class="flex items-center justify-between">
								<h4 class="font-serif text-sm font-semibold text-gray-900">{n.title}</h4>
								<span class="text-xs text-gray-500">相似度 {(n.similarity ?? 0).toFixed(2)}</span>
							</div>
							<p class="prose prose-sm mt-1 line-clamp-2 font-serif text-gray-700">{n.content}</p>
							{#if n.tags?.length}
								<div class="mt-2 flex flex-wrap gap-1">
									{#each n.tags as t (t)}
										<span class="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700"
											>#{t}</span
										>
									{/each}
								</div>
							{/if}
						</div>
					</label>
				</li>
			{/each}
		</ul>
		<div class="mt-4 text-right">
			<button
				onclick={useSelected}
				class="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
			>
				使用選取的筆記生成閃卡
			</button>
		</div>
	{/if}
</div>
