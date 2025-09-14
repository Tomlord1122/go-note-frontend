<script lang="ts">
	import { renderMarkdown } from '../utils/markdown.js';
	import { onMount } from 'svelte';

	interface Props {
		content: string;
		onContentChange: (value: string) => void;
		placeholder?: string;
		minHeight?: string;
		showToolbar?: boolean;
	}

	let {
		content,
		onContentChange,
		placeholder = 'Start writing your thoughts... (You can use Markdown syntax)',
		minHeight = '300px',
		showToolbar = true
	}: Props = $props();

	let editorMode = $state<'split' | 'edit' | 'preview'>('split');
	let textareaRef = $state<HTMLTextAreaElement | undefined>();
	let previewRef = $state<HTMLDivElement | undefined>();

	// Rendered markdown content
	let renderedContent = $derived(renderMarkdown(content));

	// Toolbar actions
	function insertMarkdown(before: string, after: string = '') {
		if (!textareaRef) return;

		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const selectedText = content.substring(start, end);

		const newContent =
			content.substring(0, start) + before + selectedText + after + content.substring(end);

		onContentChange(newContent);

		// Restore cursor position
		setTimeout(() => {
			if (textareaRef) {
				textareaRef.focus();
				const newCursorPos = start + before.length + selectedText.length;
				textareaRef.setSelectionRange(newCursorPos, newCursorPos);
			}
		}, 0);
	}

	function insertHeading(level: number) {
		const prefix = '#'.repeat(level) + ' ';
		insertMarkdown(prefix);
	}

	function insertList(ordered: boolean = false) {
		const prefix = ordered ? '1. ' : '- ';
		insertMarkdown(prefix);
	}

	function insertLink() {
		insertMarkdown('[', '](url)');
	}

	function insertImage() {
		insertMarkdown('![alt text](', ')');
	}

	function insertCodeBlock() {
		insertMarkdown('```\n', '\n```');
	}

	function insertTable() {
		const table = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

`;
		insertMarkdown(table);
	}

	// Sync scroll between editor and preview
	function syncScroll(source: 'editor' | 'preview') {
		if (editorMode !== 'split') return;

		if (source === 'editor' && textareaRef && previewRef) {
			const scrollRatio =
				textareaRef.scrollTop / (textareaRef.scrollHeight - textareaRef.clientHeight);
			previewRef.scrollTop = scrollRatio * (previewRef.scrollHeight - previewRef.clientHeight);
		} else if (source === 'preview' && previewRef && textareaRef) {
			const scrollRatio =
				previewRef.scrollTop / (previewRef.scrollHeight - previewRef.clientHeight);
			textareaRef.scrollTop = scrollRatio * (textareaRef.scrollHeight - textareaRef.clientHeight);
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey) {
			switch (e.key) {
				case 'b':
					e.preventDefault();
					insertMarkdown('**', '**');
					break;
				case 'i':
					e.preventDefault();
					insertMarkdown('*', '*');
					break;
				case 'k':
					e.preventDefault();
					insertLink();
					break;
				case '`':
					e.preventDefault();
					insertMarkdown('`', '`');
					break;
			}
		}
	}

	onMount(() => {
		// Auto-resize textarea
		function autoResize() {
			if (textareaRef) {
				textareaRef.style.height = 'auto';
				textareaRef.style.height = Math.max(parseInt(minHeight), textareaRef.scrollHeight) + 'px';
			}
		}

		const resizeObserver = new ResizeObserver(autoResize);
		if (textareaRef) {
			resizeObserver.observe(textareaRef);
		}

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<!-- Real-time Markdown Editor -->
<div class="w-full rounded-lg border border-gray-300 bg-white shadow-sm">
	<!-- Toolbar -->
	{#if showToolbar}
		<div class="border-b border-gray-200 p-2">
			<div class="flex flex-wrap items-center gap-1">
				<!-- View Mode Buttons -->
				<div class="flex rounded-md border border-gray-300 bg-gray-50 p-0.5">
					<button
						type="button"
						onclick={() => (editorMode = 'edit')}
						class="rounded px-2 py-1 text-xs font-medium transition-colors {editorMode === 'edit'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Edit
					</button>
					<button
						type="button"
						onclick={() => (editorMode = 'split')}
						class="rounded px-2 py-1 text-xs font-medium transition-colors {editorMode === 'split'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Split
					</button>
					<button
						type="button"
						onclick={() => (editorMode = 'preview')}
						class="rounded px-2 py-1 text-xs font-medium transition-colors {editorMode === 'preview'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Preview
					</button>
				</div>

				<div class="h-4 w-px bg-gray-300"></div>

				<!-- Formatting Buttons -->
				<button
					type="button"
					onclick={() => insertHeading(1)}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Heading 1"
					aria-label="Insert heading 1"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M2 4a1 1 0 011-1h2a1 1 0 011 1v4h8V4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4H6v4a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={() => insertMarkdown('**', '**')}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Bold (Ctrl+B)"
					aria-label="Make text bold"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M3 5a1 1 0 011-1h5.5a3.5 3.5 0 110 7H6v2.5a1 1 0 01-2 0V5zM6 6v4h3.5a1.5 1.5 0 000-3H6z"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={() => insertMarkdown('*', '*')}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Italic (Ctrl+I)"
					aria-label="Make text italic"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.5l-1 8H10a1 1 0 110 2H6a1 1 0 110-2h1.5l1-8H7a1 1 0 110-2h3V3a1 1 0 011-1z"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={() => insertMarkdown('`', '`')}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Inline Code (Ctrl+`)"
					aria-label="Insert inline code"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<div class="h-4 w-px bg-gray-300"></div>

				<button
					type="button"
					onclick={() => insertList(false)}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Bullet List"
					aria-label="Insert bullet list"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={() => insertList(true)}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Numbered List"
					aria-label="Insert numbered list"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={insertLink}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Link (Ctrl+K)"
					aria-label="Insert link"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={insertImage}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Image"
					aria-label="Insert image"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={insertCodeBlock}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Code Block"
					aria-label="Insert code block"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM4 14a1 1 0 100 2h4a1 1 0 100-2H4z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={insertTable}
					class="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					title="Table"
					aria-label="Insert table"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zM4 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V5a3 3 0 00-3-3H4zm2 4h8v2H6V6zm0 4h8v2H6v-2z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Editor Content -->
	<div class="flex {editorMode === 'split' ? 'divide-x divide-gray-200' : ''}">
		<!-- Editor Pane -->
		{#if editorMode === 'edit' || editorMode === 'split'}
			<div class="flex-1 {editorMode === 'split' ? 'w-1/2' : 'w-full'}">
				<textarea
					bind:this={textareaRef}
					value={content}
					oninput={(e) => onContentChange((e.target as HTMLTextAreaElement).value)}
					onscroll={() => syncScroll('editor')}
					onkeydown={handleKeydown}
					{placeholder}
					class="w-full resize-none overflow-y-auto border-0 p-4 font-mono text-sm text-gray-900 focus:ring-0 focus:outline-none"
					style="min-height: {minHeight}; max-height: 600px;"
				></textarea>
			</div>
		{/if}

		<!-- Preview Pane -->
		{#if editorMode === 'preview' || editorMode === 'split'}
			<div class="flex-1 {editorMode === 'split' ? 'w-1/2' : 'w-full'}">
				<div
					bind:this={previewRef}
					onscroll={() => syncScroll('preview')}
					class="markdown-content max-w-none overflow-y-auto p-4"
					style="min-height: {minHeight}; max-height: 600px;"
				>
					{#if content.trim()}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html renderedContent}
					{:else}
						<p class="not-prose text-gray-500 italic">
							{placeholder}
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
