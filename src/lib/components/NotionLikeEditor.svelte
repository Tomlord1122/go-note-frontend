<script lang="ts">
	import { onMount } from 'svelte';
	import { renderMarkdown } from '../utils/markdown.js';

	interface Props {
		content: string;
		onContentChange: (value: string) => void;
		placeholder?: string;
		minHeight?: string;
	}

	let {
		content,
		onContentChange,
		placeholder = "Type '/' for commands or start writing...",
		minHeight = '400px'
	}: Props = $props();

	let editorRef: HTMLTextAreaElement;
	let showSlashMenu = $state(false);
	let slashMenuPosition = $state({ x: 0, y: 0 });
	let slashMenuItems = $state<Array<{ label: string; action: () => void; icon: string }>>([]);
	let selectedSlashIndex = $state(0);
	let cursorPosition = $state(0);

	// Slash command definitions
	const slashCommands = [
		{
			label: 'Heading 1',
			action: () => insertText('# '),
			icon: 'H1',
			keywords: ['heading', 'h1', 'title']
		},
		{
			label: 'Heading 2',
			action: () => insertText('## '),
			icon: 'H2',
			keywords: ['heading', 'h2', 'subtitle']
		},
		{
			label: 'Heading 3',
			action: () => insertText('### '),
			icon: 'H3',
			keywords: ['heading', 'h3']
		},
		{
			label: 'Bold Text',
			action: () => insertText('**', '**'),
			icon: 'B',
			keywords: ['bold', 'strong']
		},
		{
			label: 'Italic Text',
			action: () => insertText('*', '*'),
			icon: 'I',
			keywords: ['italic', 'emphasis']
		},
		{
			label: 'Bullet List',
			action: () => insertText('- '),
			icon: '•',
			keywords: ['list', 'bullet', 'ul']
		},
		{
			label: 'Numbered List',
			action: () => insertText('1. '),
			icon: '1.',
			keywords: ['list', 'numbered', 'ol']
		},
		{
			label: 'Code Block',
			action: () => insertText('```\n', '\n```'),
			icon: '<>',
			keywords: ['code', 'block']
		},
		{
			label: 'Inline Code',
			action: () => insertText('`', '`'),
			icon: '`',
			keywords: ['code', 'inline']
		},
		{
			label: 'Quote',
			action: () => insertText('> '),
			icon: '"',
			keywords: ['quote', 'blockquote']
		},
		{
			label: 'Link',
			action: () => insertText('[', '](url)'),
			icon: '🔗',
			keywords: ['link', 'url']
		},
		{
			label: 'Horizontal Rule',
			action: () => insertText('---\n'),
			icon: '—',
			keywords: ['rule', 'line', 'divider']
		}
	];

	function insertText(before: string, after: string = '') {
		if (!editorRef) return;

		const start = editorRef.selectionStart;
		const end = editorRef.selectionEnd;
		const selectedText = content.substring(start, end);

		const newContent =
			content.substring(0, start) + before + selectedText + after + content.substring(end);

		onContentChange(newContent);

		// Position cursor
		setTimeout(() => {
			if (editorRef) {
				const newCursorPos = start + before.length + selectedText.length;
				editorRef.setSelectionRange(newCursorPos, newCursorPos);
				editorRef.focus();
			}
		}, 0);

		hideSlashMenu();
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		onContentChange(target.value);
		cursorPosition = target.selectionStart;
	}

	function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLTextAreaElement;
		cursorPosition = target.selectionStart;

		if (showSlashMenu) {
			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					selectedSlashIndex = Math.min(selectedSlashIndex + 1, slashMenuItems.length - 1);
					break;
				case 'ArrowUp':
					event.preventDefault();
					selectedSlashIndex = Math.max(selectedSlashIndex - 1, 0);
					break;
				case 'Enter':
					event.preventDefault();
					slashMenuItems[selectedSlashIndex]?.action();
					break;
				case 'Escape':
					event.preventDefault();
					hideSlashMenu();
					break;
			}
			return;
		}

		// Handle slash command trigger
		if (event.key === '/') {
			setTimeout(() => {
				if (editorRef) {
					const rect = getCaretPosition(editorRef, cursorPosition + 1);
					showSlashMenu = true;
					slashMenuPosition = {
						x: rect.left,
						y: rect.top + 20
					};
					slashMenuItems = slashCommands;
					selectedSlashIndex = 0;
				}
			}, 0);
		}

		// Handle other shortcuts
		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case 'b':
					event.preventDefault();
					insertText('**', '**');
					break;
				case 'i':
					event.preventDefault();
					insertText('*', '*');
					break;
				case '`':
					event.preventDefault();
					insertText('`', '`');
					break;
			}
		}
	}

	function getCaretPosition(textarea: HTMLTextAreaElement, position: number) {
		const div = document.createElement('div');
		const span = document.createElement('span');

		// Copy the textarea's style to the div
		const style = window.getComputedStyle(textarea);
		div.style.position = 'absolute';
		div.style.visibility = 'hidden';
		div.style.whiteSpace = 'pre-wrap';
		div.style.wordWrap = 'break-word';
		div.style.font = style.font;
		div.style.padding = style.padding;
		div.style.border = style.border;
		div.style.width = style.width;

		// Add the text content
		const textContent = textarea.value.substring(0, position);
		div.textContent = textContent;
		span.textContent = '|';
		div.appendChild(span);

		document.body.appendChild(div);
		const rect = span.getBoundingClientRect();
		const textareaRect = textarea.getBoundingClientRect();
		document.body.removeChild(div);

		return {
			left: rect.left - textareaRect.left,
			top: rect.top - textareaRect.top
		};
	}

	function hideSlashMenu() {
		showSlashMenu = false;
		slashMenuItems = [];
		selectedSlashIndex = 0;
	}

	function handleClickOutside(event: MouseEvent) {
		if (showSlashMenu && event.target instanceof Element && !event.target.closest('.slash-menu')) {
			hideSlashMenu();
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<!-- Notion-like Editor with Live Preview -->
<div class="relative w-full">
	<div class="flex gap-4">
		<!-- Editor Pane -->
		<div class="flex-1">
			<textarea
				bind:this={editorRef}
				value={content}
				oninput={handleInput}
				onkeydown={handleKeyDown}
				{placeholder}
				class="w-full resize-none overflow-y-auto border-0 p-4 font-mono text-sm text-gray-900 focus:ring-0 focus:outline-none"
				style="min-height: {minHeight}; max-height: 600px;"
			></textarea>
		</div>

		<!-- Live Preview Pane -->
		<div class="flex-1 border-l border-gray-200">
			<div
				class="markdown-content overflow-y-auto p-4"
				style="min-height: {minHeight}; max-height: 600px;"
			>
				{#if content.trim()}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html renderMarkdown(content)}
				{:else}
					<p class="text-gray-500 italic">
						{placeholder}
					</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Slash Command Menu -->
	{#if showSlashMenu}
		<div
			class="slash-menu absolute z-50 w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
			style="left: {slashMenuPosition.x}px; top: {slashMenuPosition.y}px;"
		>
			<div class="max-h-64 overflow-y-auto p-2">
				{#each slashMenuItems as item, index (item.label)}
					<button
						type="button"
						onclick={item.action}
						class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors {index ===
						selectedSlashIndex
							? 'bg-gray-100 text-gray-900'
							: 'text-gray-700 hover:bg-gray-50'}"
					>
						<span
							class="mr-3 flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-xs font-medium text-gray-600"
						>
							{item.icon}
						</span>
						{item.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
