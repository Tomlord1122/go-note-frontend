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
	import { PUBLIC_FRONTEND_URL } from '$env/static/public';

	let user = $state<User | null>(null);
	let userProfile = $state<UserProfile | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let apiStatus = $state<'checking' | 'online' | 'offline' | 'error'>('checking');
	let userNotes = $state<Note[]>([]);

	let currentView = $state<'notes' | 'create' | 'edit'>('notes');
	let selectedNote = $state<Note | null>(null);
	let showDeleteConfirm = $state(false);

	let filteredNotesCount = $state(0);
	let selectedNoteIds = $state<string[]>([]);

	// Mobile responsive state
	let isMobileMenuOpen = $state(false);
	let isMobile = $state(false);

	let noteForm = $state({
		title: '',
		content: '',
		tags: '',
		is_public: false
	});

	async function checkApiStatus() {
		const response = await api.healthCheck();
		if (response.data) {
			apiStatus = 'online';
		} else {
			apiStatus = 'offline';
		}
	}

	async function handleGoogleLogin() {
		loading = true;
		error = null;

		const response = await api.initiateGoogleLogin(PUBLIC_FRONTEND_URL);

		if (response.data?.url) {
			window.location.href = response.data.url;
		} else {
			error = `Login failed: ${response.error || 'Unknown error'}`;
			loading = false;
		}
	}

	function handleLogout() {
		authStore.logout();
		user = null;
		userProfile = null;
		currentView = 'notes';
	}

	async function saveNote() {
		if (!user) {
			error = 'Please login first';
			return;
		}

		if (!noteForm.title.trim() || !noteForm.content.trim()) {
			error = 'Title and content cannot be empty';
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

			const action = isEditing ? 'updated' : 'created';
			showSuccessToast(`Note ${action} successfully!`);
		} else {
			const action = isEditing ? 'update' : 'create';
			// Check if error is due to authentication failure
			if (response.error?.includes('Authentication failed')) {
				error = 'Your session has expired. Please login again.';
			} else {
				error = `Failed to ${action} note: ${response.error}`;
			}
		}

		loading = false;
	}

	function resetForm() {
		noteForm.title = '';
		noteForm.content = '';
		noteForm.tags = '';
		noteForm.is_public = false;
	}

	function startCreateNote() {
		resetForm();
		currentView = 'create';
		selectedNote = null;
	}

	function startEditNote(note: Note) {
		noteForm.title = note.title;
		noteForm.content = note.content;
		noteForm.tags = note.tags.join(', ');
		noteForm.is_public = note.is_public;
		selectedNote = note;
		currentView = 'edit';
	}

	async function deleteNote(note: Note) {
		if (!user) {
			error = 'Please login first';
			return;
		}

		loading = true;
		error = null;

		const response = await api.deleteNote(note.id);

		if (!response.error) {
			await loadUserNotes();
			showSuccessToast('Note deleted successfully!');

			if (selectedNote?.id === note.id) {
				currentView = 'notes';
				selectedNote = null;
			}
		} else {
			// Check if error is due to authentication failure
			if (response.error?.includes('Authentication failed')) {
				error = 'Your session has expired. Please login again.';
			} else {
				error = `Failed to delete note: ${response.error}`;
			}
		}

		showDeleteConfirm = false;
		loading = false;
	}

	function showSuccessToast(message: string) {
		successMessage = message;
		setTimeout(() => {
			successMessage = null;
		}, 3000);
	}

	async function loadUserNotes() {
		if (!user) return;

		const response = await api.getUserNotes(10, 0);

		if (response.data) {
			userNotes = response.data.notes;
		} else {
			// Don't show error for authentication failures as they're handled globally
			if (!response.error?.includes('Authentication failed')) {
				console.error('Failed to load notes:', response.error);
				// Optionally show user-friendly error
				error = 'Failed to load notes. Please try again.';
			}
		}
	}

	function handleViewChange(view: 'notes' | 'create' | 'edit') {
		currentView = view;
		if (view === 'notes') {
			selectedNote = null;
			resetForm();
		}
	}

	function handleDeleteNote(note: Note) {
		selectedNote = note;
		showDeleteConfirm = true;
	}

	// Mobile detection and menu handling
	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 768; // md breakpoint
		}
	}

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	onMount(() => {
		checkMobile();

		// Listen for window resize
		const handleResize = () => {
			checkMobile();
			if (!isMobile) {
				isMobileMenuOpen = false;
			}
		};

		window.addEventListener('resize', handleResize);

		const initialize = async () => {
			await checkApiStatus();
			await authStore.initialize();
			// Start the token validation timer
			authStore.startTokenValidationTimer();
		};

		initialize();

		const unsubscribe = authStore.subscribe((currentUser) => {
			const wasLoggedIn = user !== null;
			const isNowLoggedIn = currentUser !== null;

			user = currentUser;

			if (currentUser) {
				loadUserNotes();
			} else {
				userNotes = [];
				// If user was logged in but now is logged out (token expired),
				// reset the view and show appropriate message
				if (wasLoggedIn && !isNowLoggedIn) {
					currentView = 'notes';
					selectedNote = null;
					resetForm();
					error = 'Your session has expired. Please login again.';
					// Clear the error message after 5 seconds
					setTimeout(() => {
						if (error === 'Your session has expired. Please login again.') {
							error = null;
						}
					}, 5000);
				}
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
			window.removeEventListener('resize', handleResize);
			if (typeof window !== 'undefined') {
				window.removeEventListener('user-profile-loaded', handleUserProfileLoaded as EventListener);
			}
		};
	});

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

<div class="h-dvh bg-[#EDEDED]">
	<div class="flex h-full">
		<!-- Mobile Menu Overlay -->
		{#if isMobile && isMobileMenuOpen}
			<div
				class="bg-opacity-50 fixed inset-0 z-40 bg-black md:hidden"
				onclick={closeMobileMenu}
				onkeydown={(e) => e.key === 'Escape' && closeMobileMenu()}
				role="button"
				tabindex="-1"
				aria-label="Close menu"
			></div>
		{/if}

		<!-- Sidebar - Hide on mobile when not authenticated -->
		{#if user || !isMobile}
			<div class="relative">
				<Sidebar
					{user}
					{userProfile}
					{apiStatus}
					{currentView}
					userNotesCount={userNotes?.length || 0}
					{loading}
					{isMobile}
					{isMobileMenuOpen}
					onViewChange={handleViewChange}
					onGoogleLogin={handleGoogleLogin}
					onLogout={handleLogout}
					onCloseMobileMenu={closeMobileMenu}
				/>
			</div>
		{/if}

		<main class="flex min-w-0 flex-1 flex-col">
			{#if !user && isMobile}
				<!-- Mobile Header for Unauthenticated Users -->
				<header class="border-b border-gray-300 bg-[#EFEFEF] shadow-lg">
					<div class="flex items-center justify-between px-4 py-4">
						<div class="flex items-center gap-2">
							<img src="/app_icon.webp" alt="Go Note" class="h-8 w-8" />
							<h1 class="font-serif text-lg font-bold text-gray-900">Go Note</h1>
						</div>

						<!-- Mobile Login Button in Header -->
						<button
							onclick={handleGoogleLogin}
							disabled={loading || apiStatus !== 'online'}
							class="inline-flex items-center justify-center rounded-md bg-gray-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
						>
							{#if loading}
								<svg class="h-3 w-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{:else}
								Login
							{/if}
						</button>
					</div>
				</header>
			{/if}

			{#if user}
				<!-- Mobile Header with Menu Button -->
				<header class="border-b border-gray-300 bg-[#EFEFEF] shadow-lg">
					<div class="flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
						<!-- Mobile Menu Button -->
						{#if isMobile}
							<button
								onclick={toggleMobileMenu}
								class="inline-flex items-center justify-center rounded-md bg-gray-200 p-2 text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none md:hidden"
								aria-label="Toggle menu"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6h16M4 12h16M4 18h16"
									></path>
								</svg>
							</button>
						{/if}

						<div class="flex-1 {isMobile ? 'ml-4' : ''}">
							{#if currentView === 'notes'}
								<h1 class="page-title font-serif text-xl font-bold text-gray-900 md:text-2xl">
									My Notes
								</h1>
								<p class="text-xs text-gray-600 md:text-sm">
									{filteredNotesCount > 0 && filteredNotesCount !== (userNotes?.length || 0)
										? `Showing ${filteredNotesCount} / ${userNotes?.length || 0} notes`
										: `${userNotes?.length || 0} notes`}
								</p>
							{:else if currentView === 'create'}
								<h1 class="page-title font-serif text-xl font-bold text-gray-900 md:text-2xl">
									Create New Note
								</h1>
							{:else if currentView === 'edit'}
								<h1 class="page-title font-serif text-xl font-bold text-gray-900 md:text-2xl">
									Edit Note
								</h1>
							{/if}
						</div>

						{#if currentView !== 'notes'}
							<button
								onclick={() => handleViewChange('notes')}
								class="inline-flex items-center justify-center rounded-md bg-gray-200 px-2 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none md:px-3"
								aria-label="Back to notes list"
							>
								<svg class="h-4 w-4 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 19l-7-7m0 0l7-7m-7 7h18"
									></path>
								</svg>
								<span class="hidden md:inline">Back</span>
							</button>
						{/if}
					</div>
				</header>

				<div class="flex-1 overflow-y-auto">
					<div class="container mx-auto px-4 py-4 md:py-8 lg:max-w-screen-lg">
						{#if currentView === 'notes'}
							<div class="space-y-4 md:space-y-6">
								<!-- Flashcard Generators - Stack on mobile, grid on desktop -->
								<div class="grid gap-4 lg:grid-cols-2">
									<div class="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
										<h3 class="mb-3 font-serif text-base font-semibold text-gray-900 md:text-lg">
											Generate Flashcard by Query
										</h3>
										<FlashcardGenerator mode="query" />
									</div>
									<div class="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
										<h3 class="mb-3 font-serif text-base font-semibold text-gray-900 md:text-lg">
											Generate Flashcard from Notes
										</h3>
										{#if selectedNoteIds.length > 0}
											<div class="mb-3 text-sm text-gray-700">
												Selected {selectedNoteIds.length} notes
											</div>
											<FlashcardGenerator mode="notes" {selectedNoteIds} />
										{:else}
											<div class="py-6 text-center text-gray-500 md:py-8">
												<p class="text-sm">
													Please select notes from the list below to generate flashcards
												</p>
											</div>
										{/if}
									</div>
								</div>

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
				<WelcomePage {apiStatus} {loading} onGoogleLogin={handleGoogleLogin} />
			{/if}
		</main>
	</div>
</div>

<Toast message={error} type="error" onClose={() => (error = null)} />
<Toast message={successMessage} type="success" onClose={() => (successMessage = null)} />

<DeleteConfirmModal
	show={showDeleteConfirm}
	note={selectedNote}
	{loading}
	onConfirm={deleteNote}
	onCancel={() => (showDeleteConfirm = false)}
/>
