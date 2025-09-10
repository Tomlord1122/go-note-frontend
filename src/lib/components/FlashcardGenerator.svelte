<script lang="ts">
	import type { Flashcard } from '$lib/api.js';
	import { api } from '$lib/api.js';
	import FlashcardModal from './FlashcardModal.svelte';

	interface StreamPayload {
		type?: string;
		data?: Flashcard | { description?: string };
		message?: string;
		error?: string;
	}

	interface Props {
		mode: 'query' | 'notes';
		selectedNoteIds?: string[];
	}

	let { mode, selectedNoteIds = [] }: Props = $props();

	let query = $state('');
	let streaming = $state(false);
	let error = $state<string | null>(null);
	let logs = $state<string[]>([]);
	let finalCard = $state<Flashcard | null>(null);
	let controller: AbortController | null = null;
	let showModal = $state(false);

	function appendLog(text: string) {
		logs = [...logs, text];
	}

	function stop() {
		controller?.abort();
		streaming = false;
	}

	function start() {
		error = null;
		logs = [];
		finalCard = null;
		streaming = true;
		controller = new AbortController();

		const onMessage = (payload: unknown) => {
			const streamPayload = payload as StreamPayload;
			if (streamPayload?.type === 'status') {
				appendLog(
					`[status] ${(streamPayload?.data as { description?: string })?.description ?? ''}`
				);
			} else if (streamPayload?.type === 'chunk') {
				appendLog(streamPayload?.message ?? '');
			} else if (streamPayload?.type === 'complete') {
				finalCard = streamPayload?.data as Flashcard;
				appendLog('[complete] 完成');
				streaming = false;
				showModal = true; // 自動顯示彈窗
			} else if (streamPayload?.type === 'error') {
				error = streamPayload?.error || '串流錯誤';
				streaming = false;
			}
		};

		if (mode === 'query') {
			if (!query.trim()) {
				error = '請輸入查詢文字';
				streaming = false;
				return;
			}
			controller = api.streamFlashcardFromQuery(query, onMessage, controller);
		} else {
			if (!selectedNoteIds?.length) {
				error = '請先選擇至少一個筆記';
				streaming = false;
				return;
			}
			controller = api.streamFlashcardFromNotes(selectedNoteIds, onMessage, controller);
		}
	}
</script>

{#if mode === 'query'}
	<div class="space-y-4">
		<input
			id="flashcard-query"
			value={query}
			oninput={(e) => (query = (e.target as HTMLInputElement).value)}
			placeholder="輸入你想學習的主題..."
			class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-gray-500"
		/>
		<button
			onclick={start}
			class="w-full rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
			disabled={streaming || !query.trim()}
		>
			{streaming ? '生成中...' : '生成閃卡'}
		</button>
	</div>
{:else}
	<button
		onclick={start}
		class="w-full rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
		disabled={streaming || !selectedNoteIds?.length}
	>
		{streaming ? '生成中...' : '生成閃卡'}
	</button>
{/if}

{#if error}
	<div class="mt-3 rounded-md bg-red-50 p-3">
		<p class="text-sm text-red-700">{error}</p>
	</div>
{/if}

{#if streaming}
	<div class="mt-3 rounded-md bg-blue-50 p-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<svg class="mr-2 h-4 w-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span class="text-sm text-blue-700">正在生成閃卡...</span>
			</div>
			<button
				onclick={stop}
				class="text-xs text-blue-600 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
			>
				停止
			</button>
		</div>
		{#if logs.length > 0}
			<div class="mt-2 text-xs text-blue-600">
				{logs[logs.length - 1]}
			</div>
		{/if}
	</div>
{/if}

<!-- Flashcard Modal -->
<FlashcardModal show={showModal} flashcard={finalCard} onClose={() => (showModal = false)} />
