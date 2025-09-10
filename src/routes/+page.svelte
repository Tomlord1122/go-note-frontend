<script lang="ts">
	import { onMount } from 'svelte';
	import { api, authStore, type User, type UserProfile, type Note } from '$lib/api.js';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import NotesList from '$lib/components/NotesList.svelte';
	import NoteEditor from '$lib/components/NoteEditor.svelte';
	import DeleteConfirmModal from '$lib/components/DeleteConfirmModal.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import WelcomePage from '$lib/components/WelcomePage.svelte';
	import FlashcardGenerator from '$lib/components/FlashcardGenerator.svelte';

	// 狀態管理
	let user = $state<User | null>(null);
	let userProfile = $state<UserProfile | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let apiStatus = $state<'checking' | 'online' | 'offline' | 'error'>('checking');
	let userNotes = $state<Note[]>([]);

	// UI 狀態
	let currentView = $state<'notes' | 'create' | 'edit'>('notes');
	let selectedNote = $state<Note | null>(null);
	let showDeleteConfirm = $state(false);

	// 過濾和排序狀態（從 NotesList 組件提升到這裡以便在標題中顯示）
	let filteredNotesCount = $state(0);

	// 供閃卡生成用
	let selectedNoteIds = $state<string[]>([]);

	// 筆記表單（用於創建和編輯）
	let noteForm = $state({
		title: '',
		content: '',
		tags: '',
		is_public: false
	});

	// 檢查 API 狀態
	async function checkApiStatus() {
		const response = await api.healthCheck();
		if (response.data) {
			apiStatus = 'online';
		} else {
			apiStatus = 'offline';
		}
	}

	// Google OAuth 登錄
	async function handleGoogleLogin() {
		loading = true;
		error = null;

		const response = await api.initiateGoogleLogin('http://localhost:5173');

		if (response.data?.url) {
			window.location.href = response.data.url;
		} else {
			error = `登錄失敗: ${response.error || '未知錯誤'}`;
			loading = false;
		}
	}

	// 登出
	function handleLogout() {
		authStore.logout();
		user = null;
		userProfile = null;
		currentView = 'notes';
	}

	// 創建或更新筆記
	async function saveNote() {
		if (!user) {
			error = '請先登錄';
			return;
		}

		if (!noteForm.title.trim() || !noteForm.content.trim()) {
			error = '標題和內容不能為空';
			return;
		}

		loading = true;
		error = null;

		const noteData = {
			title: noteForm.title.trim(),
			content: noteForm.content.trim(),
			tags: noteForm.tags
				.split(',')
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0),
			is_public: noteForm.is_public
		};

		let response;
		const isEditing = currentView === 'edit' && selectedNote;

		if (isEditing && selectedNote) {
			response = await api.updateNote(selectedNote.id, noteData);
		} else {
			response = await api.createNote(noteData);
		}

		if (response.data) {
			resetForm();
			currentView = 'notes';
			selectedNote = null;
			await loadUserNotes();

			const action = isEditing ? '更新' : '創建';
			showSuccessToast(`筆記${action}成功！`);
		} else {
			const action = isEditing ? '更新' : '創建';
			error = `${action}筆記失敗: ${response.error}`;
		}

		loading = false;
	}

	// 重置表單
	function resetForm() {
		noteForm.title = '';
		noteForm.content = '';
		noteForm.tags = '';
		noteForm.is_public = false;
	}

	// 開始創建新筆記
	function startCreateNote() {
		resetForm();
		currentView = 'create';
		selectedNote = null;
	}

	// 開始編輯筆記
	function startEditNote(note: Note) {
		noteForm.title = note.title;
		noteForm.content = note.content;
		noteForm.tags = note.tags.join(', ');
		noteForm.is_public = note.is_public;
		selectedNote = note;
		currentView = 'edit';
	}

	// 刪除筆記
	async function deleteNote(note: Note) {
		if (!user) {
			error = '請先登錄';
			return;
		}

		loading = true;
		error = null;

		const response = await api.deleteNote(note.id);

		if (!response.error) {
			await loadUserNotes();
			showSuccessToast('筆記刪除成功！');

			if (selectedNote?.id === note.id) {
				currentView = 'notes';
				selectedNote = null;
			}
		} else {
			error = `刪除筆記失敗: ${response.error}`;
		}

		showDeleteConfirm = false;
		loading = false;
	}

	// 顯示成功消息
	function showSuccessToast(message: string) {
		successMessage = message;
		setTimeout(() => {
			successMessage = null;
		}, 3000);
	}

	// 加載用戶筆記
	async function loadUserNotes() {
		if (!user) return;

		const response = await api.getUserNotes(10, 0);

		if (response.data) {
			userNotes = response.data.notes;
		} else {
			console.error('Failed to load notes:', response.error);
		}
	}

	// 視圖切換處理器
	function handleViewChange(view: 'notes' | 'create' | 'edit') {
		currentView = view;
		if (view === 'notes') {
			selectedNote = null;
			resetForm();
		}
	}

	// 刪除筆記處理器
	function handleDeleteNote(note: Note) {
		selectedNote = note;
		showDeleteConfirm = true;
	}

	// 組件掛載時執行
	onMount(() => {
		const initialize = async () => {
			await checkApiStatus();
			await authStore.initialize();
		};

		initialize();

		const unsubscribe = authStore.subscribe((currentUser) => {
			user = currentUser;
			if (currentUser) {
				loadUserNotes();
			} else {
				userNotes = [];
			}
		});

		const handleUserProfileLoaded = (event: CustomEvent) => {
			userProfile = event.detail;
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('user-profile-loaded', handleUserProfileLoaded as EventListener);
		}

		handleOAuthCallback();

		return () => {
			unsubscribe();
			if (typeof window !== 'undefined') {
				window.removeEventListener('user-profile-loaded', handleUserProfileLoaded as EventListener);
			}
		};
	});

	// 處理 OAuth 回調
	function handleOAuthCallback() {
		const hash = window.location.hash;
		if (hash.includes('access_token')) {
			const params = new URLSearchParams(hash.substring(1));
			const accessToken = params.get('access_token');
			const refreshToken = params.get('refresh_token');

			if (accessToken) {
				localStorage.setItem('access_token', accessToken);
				if (refreshToken) {
					localStorage.setItem('refresh_token', refreshToken);
				}

				try {
					const base64Payload = accessToken.split('.')[1];
					const paddedPayload = base64Payload + '='.repeat((4 - (base64Payload.length % 4)) % 4);
					const payload = JSON.parse(atob(paddedPayload));

					const userData = {
						id: payload.sub,
						email: payload.email,
						metadata: payload.user_metadata
					};

					authStore.setUser(userData);
					console.log('User logged in:', userData);
				} catch (e) {
					console.error('Failed to parse JWT:', e);
					console.log('Saving token anyway, backend will validate it');
				}

				window.history.replaceState({}, document.title, window.location.pathname);
			}
		}
	}
</script>

<!-- 主要布局容器 -->
<div class="h-dvh bg-[#EDEDED]">
	<div class="flex h-full">
		<!-- 左側導航面板 -->
		<Sidebar
			{user}
			{userProfile}
			{apiStatus}
			{currentView}
			userNotesCount={userNotes?.length || 0}
			{loading}
			onViewChange={handleViewChange}
			onGoogleLogin={handleGoogleLogin}
			onLogout={handleLogout}
		/>

		<!-- 右側主要內容區域 -->
		<main class="flex w-full flex-1 flex-col">
			{#if user}
				<!-- 頂部標題欄 -->
				<header class="border-b border-gray-400 bg-white px-8 py-6 shadow-sm">
					<div class="flex items-center justify-between">
						<div>
							{#if currentView === 'notes'}
								<h1 class="page-title font-serif text-2xl font-bold text-gray-900">我的筆記</h1>
								<p class="text-sm text-gray-600">
									{filteredNotesCount > 0 && filteredNotesCount !== (userNotes?.length || 0)
										? `顯示 ${filteredNotesCount} / ${userNotes?.length || 0} 篇筆記`
										: `${userNotes?.length || 0} 篇筆記`}
								</p>
							{:else if currentView === 'create'}
								<h1 class="page-title font-serif text-2xl font-bold text-gray-900">創建新筆記</h1>
							{:else if currentView === 'edit'}
								<h1 class="page-title font-serif text-2xl font-bold text-gray-900">編輯筆記</h1>
							{/if}
						</div>

						{#if currentView !== 'notes'}
							<button
								onclick={() => handleViewChange('notes')}
								class="inline-flex items-center justify-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
								aria-label="返回筆記列表"
							>
								<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 19l-7-7m0 0l7-7m-7 7h18"
									></path>
								</svg>
								返回
							</button>
						{/if}
					</div>
				</header>

				<!-- 主要內容區域 -->
				<div class="flex-1 overflow-y-auto">
					<div class="container mx-auto px-4 py-8 lg:max-w-screen-lg">
						{#if currentView === 'notes'}
							<div class="space-y-6">
								<!-- 闪卡生成区域 -->
								<div class="grid gap-4 md:grid-cols-2">
									<div class="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
										<h3 class="mb-3 font-serif text-lg font-semibold text-gray-900">
											查詢生成閃卡
										</h3>
										<FlashcardGenerator mode="query" />
									</div>
									<div class="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
										<h3 class="mb-3 font-serif text-lg font-semibold text-gray-900">
											從筆記生成閃卡
										</h3>
										{#if selectedNoteIds.length > 0}
											<div class="mb-3 text-sm text-gray-700">
												已選擇 {selectedNoteIds.length} 篇筆記
											</div>
											<FlashcardGenerator mode="notes" {selectedNoteIds} />
										{:else}
											<div class="py-8 text-center text-gray-500">
												<p class="text-sm">請在下方筆記列表中勾選想要生成閃卡的筆記</p>
											</div>
										{/if}
									</div>
								</div>

								<!-- 笔记列表区域 -->
								<div>
									<NotesList
										notes={userNotes}
										onEditNote={startEditNote}
										onDeleteNote={handleDeleteNote}
										onCreateNote={startCreateNote}
										onFilteredCountChange={(count) => (filteredNotesCount = count)}
										onSelectedNotesChange={(ids) => (selectedNoteIds = ids)}
									/>
								</div>
							</div>
						{:else if currentView === 'create' || currentView === 'edit'}
							<NoteEditor
								title={noteForm.title}
								content={noteForm.content}
								tags={noteForm.tags}
								isPublic={noteForm.is_public}
								{loading}
								isEditing={currentView === 'edit'}
								onSave={saveNote}
								onCancel={() => handleViewChange('notes')}
								onTitleChange={(value) => (noteForm.title = value)}
								onContentChange={(value) => (noteForm.content = value)}
								onTagsChange={(value) => (noteForm.tags = value)}
								onPublicChange={(value) => (noteForm.is_public = value)}
							/>
						{/if}
					</div>
				</div>
			{:else}
				<WelcomePage {apiStatus} />
			{/if}
		</main>
	</div>
</div>

<!-- 通知組件 -->
<Toast message={error} type="error" onClose={() => (error = null)} />
<Toast message={successMessage} type="success" onClose={() => (successMessage = null)} />

<!-- 刪除確認 Modal -->
<DeleteConfirmModal
	show={showDeleteConfirm}
	note={selectedNote}
	{loading}
	onConfirm={deleteNote}
	onCancel={() => (showDeleteConfirm = false)}
/>
