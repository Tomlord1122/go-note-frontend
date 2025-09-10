<script lang="ts">
	interface Props {
		title: string;
		content: string;
		tags: string;
		isPublic: boolean;
		loading: boolean;
		isEditing: boolean;
		onSave: () => void;
		onCancel: () => void;
		onTitleChange: (value: string) => void;
		onContentChange: (value: string) => void;
		onTagsChange: (value: string) => void;
		onPublicChange: (value: boolean) => void;
	}

	let {
		title,
		content,
		tags,
		isPublic,
		loading,
		isEditing,
		onSave,
		onCancel,
		onTitleChange,
		onContentChange,
		onTagsChange,
		onPublicChange
	}: Props = $props();
</script>

<!-- 筆記編輯器 -->
<div class="container mx-auto lg:max-w-screen-md">
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onSave();
		}}
		class="rounded-lg border border-gray-300 bg-white p-6 shadow-sm sm:p-8"
	>
		<div class="space-y-6">
			<!-- 標題輸入 -->
			<div>
				<label for="note-title" class="mb-2 block text-sm font-medium text-gray-700">
					筆記標題
				</label>
				<input
					value={title}
					oninput={(e) => onTitleChange((e.target as HTMLInputElement).value)}
					type="text"
					id="note-title"
					placeholder="輸入筆記標題..."
					required
					class="w-full rounded-md border-gray-300 px-4 py-3 font-serif text-lg text-gray-900 shadow-sm focus:border-gray-500 focus:ring-gray-500"
				/>
			</div>

			<!-- 內容輸入 -->
			<div>
				<label for="note-content" class="mb-2 block text-sm font-medium text-gray-700">
					筆記內容
				</label>
				<textarea
					value={content}
					oninput={(e) => onContentChange((e.target as HTMLTextAreaElement).value)}
					id="note-content"
					placeholder="開始寫下你的想法..."
					rows="12"
					required
					class="w-full resize-none rounded-md border-gray-300 px-4 py-3 font-serif text-gray-900 shadow-sm focus:border-gray-500 focus:ring-gray-500"
				></textarea>
			</div>

			<!-- 標籤和設置 -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<label for="note-tags" class="mb-2 block text-sm font-medium text-gray-700"> 標籤 </label>
					<input
						value={tags}
						oninput={(e) => onTagsChange((e.target as HTMLInputElement).value)}
						type="text"
						id="note-tags"
						placeholder="工作, 重要, 想法"
						class="w-full rounded-md border-gray-300 px-4 py-3 shadow-sm focus:border-gray-500 focus:ring-gray-500"
					/>
					<p class="mt-1 text-xs text-gray-500">用逗號分隔多個標籤</p>
				</div>
				<div class="flex items-center">
					<label class="flex cursor-pointer items-center">
						<input
							checked={isPublic}
							onchange={(e) => onPublicChange((e.target as HTMLInputElement).checked)}
							type="checkbox"
							class="h-4 w-4 rounded border-gray-300 text-gray-600 shadow-sm focus:ring-gray-500"
						/>
						<span class="ml-3 text-sm font-medium text-gray-700">公開筆記</span>
					</label>
				</div>
			</div>
		</div>

		<!-- 表單操作按鈕 -->
		<footer class="mt-8 flex justify-end gap-3 border-t border-gray-300 pt-6">
			<button
				type="button"
				onclick={onCancel}
				disabled={loading}
				class="inline-flex items-center justify-center rounded-md bg-gray-200 px-6 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:opacity-50"
			>
				取消
			</button>
			<button
				type="submit"
				disabled={loading}
				class="inline-flex items-center justify-center rounded-md bg-gray-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
			>
				{#if loading}
					<svg class="mr-2 -ml-1 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					保存中...
				{:else}
					{isEditing ? '更新筆記' : '創建筆記'}
				{/if}
			</button>
		</footer>
	</form>
</div>
