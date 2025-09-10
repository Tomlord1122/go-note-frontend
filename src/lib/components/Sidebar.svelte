<script lang="ts">
	import type { User, UserProfile } from '$lib/api.js';

	interface Props {
		user: User | null;
		userProfile: UserProfile | null;
		apiStatus: 'checking' | 'online' | 'offline' | 'error';
		currentView: 'notes' | 'create' | 'edit';
		userNotesCount: number;
		loading: boolean;
		onViewChange: (view: 'notes' | 'create' | 'edit') => void;
		onGoogleLogin: () => void;
		onLogout: () => void;
	}

	let {
		user,
		userProfile,
		apiStatus,
		currentView,
		userNotesCount,
		loading,
		onViewChange,
		onGoogleLogin,
		onLogout
	}: Props = $props();
</script>

<!-- 左側導航面板 -->
<aside class="w-1/5 border-r border-gray-400 bg-white shadow-sm">
	<!-- 品牌標題 -->
	<header class="border-b border-gray-300 p-6">
		<h1 class="font-serif text-xl font-bold text-gray-900">Go Note</h1>
		<div class="mt-2 flex items-center">
			<div
				class="mr-2 h-2 w-2 rounded-full {apiStatus === 'online'
					? 'bg-gray-600'
					: apiStatus === 'offline'
						? 'bg-gray-800'
						: 'bg-gray-400'}"
				aria-label="API 狀態"
			></div>
			<span class="text-xs text-gray-600">
				{apiStatus === 'online' ? 'API 運行中' : apiStatus === 'offline' ? 'API 離線' : '檢查中'}
			</span>
		</div>
	</header>

	{#if user}
		<!-- 用戶資訊 -->
		<div class="border-b border-gray-300 p-6">
			<div class="text-center">
				{#if user.metadata?.picture}
					<img
						src={user.metadata.picture as string}
						alt="用戶頭像"
						class="mx-auto mb-3 h-12 w-12 rounded-full border border-gray-200"
					/>
				{:else}
					<div
						class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200"
					>
						<svg
							class="h-6 w-6 text-gray-500"
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
				{/if}
				<div class="text-sm">
					{#if user.metadata?.full_name}
						<p class="font-medium text-gray-900">{user.metadata.full_name}</p>
					{/if}
					<p class="truncate text-gray-600">{user.email}</p>
					{#if userProfile?.username}
						<p class="mt-1 text-xs text-gray-500">@{userProfile.username}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- 導航選單 -->
		<nav class="flex-1 p-4" aria-label="主要導航">
			<ul class="space-y-2">
				<li>
					<button
						onclick={() => onViewChange('notes')}
						class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-200 {currentView ===
						'notes'
							? 'bg-gray-200 text-gray-900'
							: 'text-gray-700 hover:bg-gray-100'}"
						aria-pressed={currentView === 'notes'}
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
						我的筆記
						{#if userNotesCount > 0}
							<span class="ml-auto text-xs text-gray-500">({userNotesCount})</span>
						{/if}
					</button>
				</li>
				<li>
					<button
						onclick={() => onViewChange('create')}
						class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-200 {currentView ===
						'create'
							? 'bg-gray-200 text-gray-900'
							: 'text-gray-700 hover:bg-gray-100'}"
						aria-pressed={currentView === 'create'}
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							></path>
						</svg>
						新建筆記
					</button>
				</li>
			</ul>
		</nav>

		<!-- 登出按鈕 -->
		<div class="border-t border-gray-300 p-4">
			<button
				onclick={onLogout}
				class="inline-flex w-full items-center justify-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none"
			>
				<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					></path>
				</svg>
				登出
			</button>
		</div>
	{:else}
		<!-- 未登錄導航 -->
		<div class="flex flex-1 flex-col justify-center p-6">
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200"
				>
					<svg class="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						></path>
					</svg>
				</div>
				<p class="mb-4 text-sm text-gray-600">請登錄以開始使用</p>
				<button
					onclick={onGoogleLogin}
					disabled={loading || apiStatus !== 'online'}
					class="inline-flex w-full items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none disabled:bg-gray-400"
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
						登錄中...
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
						使用 Google 登錄
					{/if}
				</button>

				{#if apiStatus !== 'online'}
					<p class="mt-2 text-xs text-gray-600">API 服務未運行</p>
				{/if}
			</div>
		</div>
	{/if}
</aside>
