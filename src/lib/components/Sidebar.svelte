<script lang="ts">
	import type { User, Note } from '$lib/api.js';
	import FileUpload from './FileUpload.svelte';

	interface Props {
		user: User | null;
		apiStatus: 'checking' | 'online' | 'offline' | 'error';
		currentView: 'notes' | 'create' | 'edit';
		userNotesCount: number;
		loading: boolean;
		isMobile: boolean;
		isMobileMenuOpen: boolean;
		openNotes: Note[];
		activeNoteId: string | null;
		onViewChange: (view: 'notes' | 'create' | 'edit') => void;
		onGoogleLogin: () => void;
		onLogout: () => void;
		onCloseMobileMenu: () => void;
		onSwitchToNoteTab: (noteId: string) => void;
		onCloseNoteTab: (noteId: string) => void;
		onFileUpload: (files: { title: string; content: string; filename: string }[]) => void;
	}

	let {
		user,
		apiStatus,
		currentView,
		userNotesCount,
		loading,
		isMobile,
		isMobileMenuOpen,
		openNotes,
		activeNoteId,
		onViewChange,
		onGoogleLogin,
		onLogout,
		onCloseMobileMenu,
		onSwitchToNoteTab,
		onCloseNoteTab,
		onFileUpload
	}: Props = $props();

	function handleViewChangeAndClose(view: 'notes' | 'create' | 'edit') {
		onViewChange(view);
		onCloseMobileMenu();
	}

	function handleLogoutAndClose() {
		onLogout();
		onCloseMobileMenu();
	}
</script>

<!-- Mobile/Desktop Responsive Sidebar -->
<aside
	class="flex h-full flex-col border-r border-gray-400 bg-[#dfdfdff0] shadow-sm transition-transform duration-300 ease-in-out overflow-hidden
		{isMobile
		? `fixed inset-y-0 left-0 z-50 w-64 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
		: 'relative w-80 min-w-[280px] max-w-[320px] lg:w-1/5'}"
>
	<!-- Brand header -->
	<header class="border-b border-gray-300 p-4 md:p-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<img src="/app_icon.webp" alt="Go Note" class="h-8 w-8 rounded-lg md:h-10 md:w-10" />
				<h1 class="font-serif text-lg font-bold text-gray-900 md:text-xl">Go Note</h1>
			</div>
			<!-- Mobile Close Button -->
			{#if isMobile}
				<button
					onclick={onCloseMobileMenu}
					class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none md:hidden"
					aria-label="Close menu"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			{/if}
		</div>

		<div class="mt-2 flex items-center justify-between">
			<div class="flex items-center">
				<div
					class="mr-2 h-2 w-2 rounded-full {apiStatus === 'online'
						? 'bg-gray-600'
						: apiStatus === 'offline'
							? 'bg-gray-800'
							: 'bg-gray-400'}"
					aria-label="API Status"
				></div>
				<span class="text-xs text-gray-600">
					{apiStatus === 'online'
						? 'API Running'
						: apiStatus === 'offline'
							? 'API Offline'
							: 'Checking'}
				</span>
			</div>
			{#if user}
				<FileUpload onFileUpload={onFileUpload} disabled={!user} />
			{/if}
		</div>
	</header>

	{#if user}
		<!-- Navigation menu -->
		<nav class="flex-1 p-4" aria-label="Main navigation">
			<ul class="space-y-2">
				<li>
					<button
						onclick={() => handleViewChangeAndClose('notes')}
						class="flex w-full items-center rounded-md px-3 py-3 text-left text-sm font-medium transition-colors duration-200 {currentView ===
						'notes'
							? 'bg-gray-200 text-gray-900'
							: 'text-gray-700 hover:bg-gray-100'} md:py-2"
						aria-pressed={currentView === 'notes'}
					>
						<svg
							class="mr-3 h-5 w-5 md:mr-2 md:h-4 md:w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
						My Notes
						{#if userNotesCount > 0}
							<span class="ml-auto text-xs text-gray-500">({userNotesCount})</span>
						{/if}
					</button>
				</li>
				<li>
					<button
						onclick={() => handleViewChangeAndClose('create')}
						class="flex w-full items-center rounded-md px-3 py-3 text-left text-sm font-medium transition-colors duration-200 {currentView ===
						'create'
							? 'bg-gray-200 text-gray-900'
							: 'text-gray-700 hover:bg-gray-100'} md:py-2"
						aria-pressed={currentView === 'create'}
					>
						<svg
							class="mr-3 h-5 w-5 md:mr-2 md:h-4 md:w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							></path>
						</svg>
						New Note
					</button>
				</li>
			</ul>

			<!-- Open Notes Tabs -->
			{#if openNotes.length > 0}
				<div class="mt-4 border-t border-gray-300 pt-4">
					<div class="mb-3 flex items-center justify-between">
						<h3 class="text-xs font-semibold tracking-wider text-gray-500 uppercase">
							Open Notes
						</h3>
					</div>
					<div class="scrollbar-stable max-h-60 space-y-1 overflow-y-auto">
						{#each openNotes as note (note.id)}
							<div
								class="group flex items-center rounded-md px-2 py-2 text-sm transition-colors duration-200 cursor-pointer min-w-0 {activeNoteId ===
								note.id
									? 'bg-gray-200 text-gray-900'
									: 'text-gray-700 hover:bg-gray-100'}"
								onclick={() => {
									onSwitchToNoteTab(note.id);
									onCloseMobileMenu();
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onSwitchToNoteTab(note.id);
										onCloseMobileMenu();
									}
								}}
								role="button"
								tabindex="0"
								aria-label="Open note: {note.title}"
							>
								<span
									class="flex-1 truncate text-left font-medium min-w-0 overflow-hidden"
									title={note.title}
								>
									{note.title.length > 25 ? note.title.slice(0, 25) + '...' : note.title}
								</span>
								<button
									onclick={(e) => {
										e.stopPropagation();
										onCloseNoteTab(note.id);
									}}
									class="ml-2 flex-shrink-0 rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-300 hover:text-gray-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
									aria-label="Close note: {note.title}"
									title="Close note"
								>
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										></path>
									</svg>
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</nav>

		<!-- Logout button -->
		<div class="border-t border-gray-300 p-4">
			<button
				onclick={handleLogoutAndClose}
				class="inline-flex w-full items-center justify-center rounded-md bg-gray-200 px-3 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none md:py-2"
			>
				<svg
					class="mr-2 h-5 w-5 md:h-4 md:w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					></path>
				</svg>
				Logout
			</button>
		</div>
	{:else}
		<!-- Unauthenticated navigation -->
		<div class="flex flex-1 flex-col justify-center p-4 md:p-6">
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 md:h-12 md:w-12"
				>
					<svg
						class="h-5 w-5 text-gray-500 md:h-6 md:w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						></path>
					</svg>
				</div>
				<p class="mb-4 text-sm text-gray-600">Please login to get started</p>
				<button
					onclick={onGoogleLogin}
					disabled={loading || apiStatus !== 'online'}
					class="inline-flex w-full items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400 md:py-2"
				>
					{#if loading}
						<svg class="mr-3 -ml-1 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
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
						Logging in...
					{:else}
						<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Login with Google
					{/if}
				</button>

				{#if apiStatus !== 'online'}
					<p class="mt-2 text-xs text-gray-600">API service is not running</p>
				{/if}
			</div>
		</div>
	{/if}
</aside>
