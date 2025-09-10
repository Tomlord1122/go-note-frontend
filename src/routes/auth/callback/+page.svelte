<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let status = $state<'processing' | 'success' | 'error'>('processing');
	let message = $state<string>('Processing...');

	onMount(() => {
		if (!browser) return;
		handleOAuthCallback();
	});

	async function handleOAuthCallback() {
		try {
			const hash = window.location.hash;
			const search = window.location.search;

			let accessToken = '';
			let refreshToken = '';

			if (hash) {
				const hashParams = new URLSearchParams(hash.substring(1));
				accessToken = hashParams.get('access_token') || '';
				refreshToken = hashParams.get('refresh_token') || '';
			}

			if (!accessToken && search) {
				const searchParams = new URLSearchParams(search);
				accessToken = searchParams.get('access_token') || '';
				refreshToken = searchParams.get('refresh_token') || '';
			}

			if (accessToken) {
				localStorage.setItem('access_token', accessToken);
				if (refreshToken) {
					localStorage.setItem('refresh_token', refreshToken);
				}

				setTimeout(() => {
					window.location.replace('/');
				}, 2000);
			} else {
				const errorParam =
					new URLSearchParams(search).get('error') ||
					new URLSearchParams(hash.substring(1)).get('error');

				if (errorParam) {
					const errorDescription =
						new URLSearchParams(search).get('error_description') ||
						new URLSearchParams(hash.substring(1)).get('error_description');

					status = 'error';
					message = `Login failed: ${errorDescription || errorParam}`;
				} else {
					status = 'error';
					message = 'No valid login credentials received';
				}
			}
		} catch (error) {
			console.error('OAuth callback error:', error);
			status = 'error';
			message = `Error processing login: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
				<h2 class="mb-2 text-xl font-semibold text-gray-900">Processing login</h2>
				<p class="text-gray-600">{message}</p>
			{:else if status === 'success'}
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
				>
					<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">Login successful</h2>
				<p class="mb-6 text-gray-600">{message}</p>
				<button
					onclick={goHome}
					class="rounded-md bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700"
				>
					Back to Home
				</button>
			{:else}
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
				<h2 class="mb-2 text-xl font-semibold text-gray-900">Login failed</h2>
				<p class="mb-6 text-gray-600">{message}</p>
				<button
					onclick={goHome}
					class="rounded-md bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700"
				>
					Back to Home
				</button>
			{/if}
		</div>
	</div>
</div>
