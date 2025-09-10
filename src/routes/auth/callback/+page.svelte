<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let status = $state<'processing' | 'success' | 'error'>('processing');
	let message = $state<string>('正在處理登錄...');

	onMount(() => {
		if (!browser) return;

		// 處理 OAuth 回調
		handleOAuthCallback();
	});

	async function handleOAuthCallback() {
		try {
			// 檢查 URL 中是否有 access_token（通常在 hash 中）
			const hash = window.location.hash;
			const search = window.location.search;

			let accessToken = '';
			let refreshToken = '';

			// 嘗試從 hash 中提取 token（Supabase OAuth 通常使用 hash）
			if (hash) {
				const hashParams = new URLSearchParams(hash.substring(1));
				accessToken = hashParams.get('access_token') || '';
				refreshToken = hashParams.get('refresh_token') || '';
			}

			// 如果 hash 中沒有，嘗試從 query parameters 中提取
			if (!accessToken && search) {
				const searchParams = new URLSearchParams(search);
				accessToken = searchParams.get('access_token') || '';
				refreshToken = searchParams.get('refresh_token') || '';
			}

			if (accessToken) {
				// 保存 tokens
				localStorage.setItem('access_token', accessToken);
				if (refreshToken) {
					localStorage.setItem('refresh_token', refreshToken);
				}

				// 2秒後重定向到首頁
				setTimeout(() => {
					window.location.replace('/');
				}, 2000);
			} else {
				// 檢查是否有錯誤
				const errorParam =
					new URLSearchParams(search).get('error') ||
					new URLSearchParams(hash.substring(1)).get('error');

				if (errorParam) {
					const errorDescription =
						new URLSearchParams(search).get('error_description') ||
						new URLSearchParams(hash.substring(1)).get('error_description');

					status = 'error';
					message = `登錄失敗: ${errorDescription || errorParam}`;
				} else {
					status = 'error';
					message = '未收到有效的登錄憑證';
				}
			}
		} catch (error) {
			console.error('OAuth callback error:', error);
			status = 'error';
			message = `處理登錄時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`;
		}
	}

	function goHome() {
		window.location.replace('/');
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4"
>
	<div class="w-full max-w-md">
		<div class="rounded-lg bg-white p-8 text-center shadow-md">
			{#if status === 'processing'}
				<!-- 處理中 -->
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
				>
					<svg class="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">處理登錄中</h2>
				<p class="text-gray-600">{message}</p>
			{:else if status === 'success'}
				<!-- 成功 -->
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
				>
					<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">登錄成功</h2>
				<p class="mb-6 text-gray-600">{message}</p>
				<button
					onclick={goHome}
					class="rounded-md bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700"
				>
					返回首頁
				</button>
			{:else}
				<!-- 錯誤 -->
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
				>
					<svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">登錄失敗</h2>
				<p class="mb-6 text-gray-600">{message}</p>
				<button
					onclick={goHome}
					class="rounded-md bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700"
				>
					返回首頁
				</button>
			{/if}
		</div>

		<!-- 調試信息 -->
		{#if browser}
			<div class="mt-4 rounded-lg bg-white p-4 shadow-md">
				<h3 class="mb-2 text-sm font-semibold text-gray-700">調試信息</h3>
				<div class="space-y-1 text-xs text-gray-500">
					<p><strong>URL Hash:</strong> {window.location.hash || '無'}</p>
					<p><strong>URL Search:</strong> {window.location.search || '無'}</p>
					<p><strong>Complete URL:</strong> {window.location.href}</p>
				</div>
			</div>
		{/if}
	</div>
</div>
