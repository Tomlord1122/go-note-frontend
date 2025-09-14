<script lang="ts">
	import type { Note } from '$lib/api.js';

	interface Props {
		onFileUpload: (files: { title: string; content: string; filename: string }[]) => void;
		disabled?: boolean;
	}

	let { onFileUpload, disabled = false }: Props = $props();

	let fileInput: HTMLInputElement;
	let isDragOver = $state(false);
	let isProcessing = $state(false);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			processFiles(Array.from(target.files));
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		if (event.dataTransfer?.files) {
			processFiles(Array.from(event.dataTransfer.files));
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	async function processFiles(files: File[]) {
		isProcessing = true;
		const markdownFiles = files.filter(file => 
			file.name.toLowerCase().endsWith('.md') || 
			file.name.toLowerCase().endsWith('.markdown') ||
			file.type === 'text/markdown'
		);

		if (markdownFiles.length === 0) {
			alert('Please select only markdown files (.md or .markdown)');
			isProcessing = false;
			return;
		}

		try {
			const parsedFiles = await Promise.all(
				markdownFiles.map(async (file) => {
					const content = await file.text();
					const lines = content.split('\n');
					
					// First non-empty line becomes title
					let title = '';
					let contentStart = 0;
					
					for (let i = 0; i < lines.length; i++) {
						const line = lines[i].trim();
						if (line) {
							// Remove markdown heading syntax if present
							title = line.replace(/^#+\s*/, '').trim();
							contentStart = i + 1;
							break;
						}
					}

					// If no title found, use filename without extension
					if (!title) {
						title = file.name.replace(/\.(md|markdown)$/i, '');
						contentStart = 0;
					}

					// Rest of the content (skip empty lines after title)
					let remainingContent = lines.slice(contentStart).join('\n').trim();
					
					// Ensure content is not empty - if it is, use a placeholder
					if (!remainingContent) {
						remainingContent = 'Content imported from file.';
					}

					return {
						title: title || file.name.replace(/\.(md|markdown)$/i, ''),
						content: remainingContent,
						filename: file.name
					};
				})
			);

			onFileUpload(parsedFiles);
			
			// Reset file input
			if (fileInput) {
				fileInput.value = '';
			}
		} catch (error) {
			console.error('Error processing files:', error);
			alert('Error processing files. Please try again.');
		} finally {
			isProcessing = false;
		}
	}

	function openFileDialog() {
		if (!disabled && fileInput) {
			fileInput.click();
		}
	}
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInput}
	type="file"
	accept=".md,.markdown,text/markdown"
	multiple
	onchange={handleFileSelect}
	class="hidden"
	{disabled}
/>

<!-- Compact Upload Button -->
<button
	onclick={openFileDialog}
	{disabled}
	class="inline-flex items-center justify-center rounded-md bg-gray-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
	aria-label="Upload markdown files"
	title="Upload markdown files"
>
	{#if isProcessing}
		<svg class="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
		</svg>
	{:else}
		<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
		</svg>
	{/if}
</button>
	