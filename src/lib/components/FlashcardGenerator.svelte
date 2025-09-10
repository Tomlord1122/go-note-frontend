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
				appendLog('[complete] Complete');
				streaming = false;
				showModal = true;
			} else if (streamPayload?.type === 'error') {
				error = streamPayload?.error || 'Stream error';
				streaming = false;
			}
		};

		if (mode === 'query') {
			if (!query.trim()) {
				error = 'Please enter a query';
				streaming = false;
				return;
			}
			controller = api.streamFlashcardFromQuery(query, onMessage, controller);
		} else {
			if (!selectedNoteIds?.length) {
				error = 'Please select at least one note';
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
			placeholder="Enter the topic you want to learn..."
			class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-gray-500"
		/>
		<button
			onclick={start}
			class="w-full rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
			disabled={streaming || !query.trim()}
		>
			{streaming ? 'Generating...' : 'Generate Flashcard'}
		</button>
	</div>
{:else}
	<button
		onclick={start}
		class="w-full rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
		disabled={streaming || !selectedNoteIds?.length}
	>
		{streaming ? 'Generating...' : 'Generate Flashcard'}
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
				<span class="text-sm text-blue-700">Generating flashcard...</span>
			</div>
			<button
				onclick={stop}
				class="text-xs text-blue-600 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
			>
				Stop
			</button>
		</div>
		{#if logs.length > 0}
			<div class="mt-2 text-xs text-blue-600">
				{logs[logs.length - 1]}
			</div>
		{/if}
	</div>
{/if}

<FlashcardModal show={showModal} flashcard={finalCard} onClose={() => (showModal = false)} />
