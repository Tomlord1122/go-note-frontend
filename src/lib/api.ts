// API configuration and utility functions
import { PUBLIC_API_BASE_URL, PUBLIC_FRONTEND_URL } from '$env/static/public';
// API base URL
export const API_BASE = PUBLIC_API_BASE_URL;

// API response type
export interface ApiResponse<T = unknown> {
	data?: T;
	error?: string;
	message?: string;
}

export interface User {
	id: string;
	email: string;
	metadata?: Record<string, unknown>;
}

export interface UserProfile {
	id: string;
	username?: string;
	display_name?: string;
	avatar_url?: string;
	preferences?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface Note {
	id: string;
	user_id: string;
	title: string;
	content: string;
	tags: string[];
	is_public: boolean;
	created_at: string;
	updated_at: string;
}

// Vector search result item
export interface SearchNotesItem extends Note {
	similarity: number;
}

// Flashcard type
export interface Flashcard {
	question: string;
	answer: string;
	explanation?: string;
	difficulty?: string;
	tags?: string[];
}

export interface OAuthResponse {
	url: string;
	message: string;
}

// API request utility functions
class ApiClient {
	private baseUrl: string;
	private isRedirectingToLogin = false;

	constructor(baseUrl: string = API_BASE) {
		this.baseUrl = baseUrl;
	}

	// Get authentication headers
	private getAuthHeaders(): HeadersInit {
		const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
		return {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` })
		};
	}

	// Handle authentication error and redirect to login page
	private handleAuthError() {
		if (this.isRedirectingToLogin) return;
		this.isRedirectingToLogin = true;

		// Clear authentication state
		if (typeof window !== 'undefined') {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
		}

		// Notify AuthStore that user has logged out
		AuthStore.getInstance().setUser(null);

		// Delay resetting flag to avoid multiple redirects
		setTimeout(() => {
			this.isRedirectingToLogin = false;
		}, 1000);

		console.log('Token expired or invalid, user logged out');
	}

	// Generic request method with automatic token refresh
	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount = 0
	): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				headers: this.getAuthHeaders(),
				...options
			});

			// Handle 401 unauthorized response - try to refresh token once
			if (response.status === 401 && retryCount === 0) {
				console.log('401 Unauthorized, attempting token refresh...');

				const refreshed = await this.refreshToken();
				if (refreshed) {
					// Retry the original request with new token
					console.log('Retrying request with refreshed token');
					return this.request<T>(endpoint, options, retryCount + 1);
				} else {
					// Refresh failed, handle auth error
					this.handleAuthError();
					return {
						error: 'Authentication failed. Please login again.'
					};
				}
			}

			// If still 401 after refresh attempt, handle auth error
			if (response.status === 401) {
				this.handleAuthError();
				return {
					error: 'Authentication failed. Please login again.'
				};
			}

			// Handle 204 No Content response (like DELETE operations)
			if (response.status === 204) {
				return { data: {} as T };
			}

			// Try to parse JSON, return empty object if failed
			let data;
			try {
				data = await response.json();
			} catch {
				data = {};
			}

			if (!response.ok) {
				return {
					error: data.error || `HTTP ${response.status}: ${response.statusText}`
				};
			}

			return { data };
		} catch (error) {
			return {
				error: error instanceof Error ? error.message : 'Network error'
			};
		}
	}

	// Read SSE stream (POST) with token refresh support
	private async streamSSE(
		endpoint: string,
		body: unknown,
		onMessage: (payload: unknown) => void,
		signal?: AbortSignal,
		retryCount = 0
	): Promise<void> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'POST',
			headers: this.getAuthHeaders(),
			body: JSON.stringify(body),
			signal
		});

		// Handle 401 unauthorized response - try to refresh token once
		if (response.status === 401 && retryCount === 0) {
			console.log('SSE 401 Unauthorized, attempting token refresh...');

			const refreshed = await this.refreshToken();
			if (refreshed) {
				// Retry the SSE request with new token
				console.log('Retrying SSE request with refreshed token');
				return this.streamSSE(endpoint, body, onMessage, signal, retryCount + 1);
			} else {
				this.handleAuthError();
				throw new Error('Authentication failed. Please login again.');
			}
		}

		// If still 401 after refresh attempt, handle auth error
		if (response.status === 401) {
			this.handleAuthError();
			throw new Error('Authentication failed. Please login again.');
		}

		if (!response.ok || !response.body) {
			const text = await response.text().catch(() => '');
			throw new Error(text || `HTTP ${response.status}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let buffer = '';

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			let lineEnd;
			// SSE is segmented by \n\n, each segment contains one or more lines starting with data:
			while ((lineEnd = buffer.indexOf('\n\n')) !== -1) {
				const chunk = buffer.slice(0, lineEnd);
				buffer = buffer.slice(lineEnd + 2);

				const lines = chunk.split('\n');
				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed.startsWith('data:')) continue;
					const jsonStr = trimmed.slice(5).trim();
					if (!jsonStr) continue;
					try {
						const payload = JSON.parse(jsonStr);
						onMessage(payload);
					} catch {
						// Ignore non-JSON data
					}
				}
			}
		}
	}

	// Health check
	async healthCheck() {
		return this.request('/health');
	}

	// Authentication related
	async initiateGoogleLogin(redirectUrl: string = PUBLIC_FRONTEND_URL) {
		return this.request<OAuthResponse>('/auth/google/login', {
			method: 'POST',
			body: JSON.stringify({ redirect_url: redirectUrl })
		});
	}

	async getCurrentUser() {
		return this.request<{ user: User; profile: UserProfile }>('/auth/user');
	}

	async logout() {
		return this.request('/auth/logout', {
			method: 'POST'
		});
	}

	// Refresh access token using refresh token
	async refreshToken(): Promise<boolean> {
		const refreshToken =
			typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
		if (!refreshToken) {
			console.log('No refresh token available');
			return false;
		}

		try {
			const response = await fetch(`${this.baseUrl}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ refresh_token: refreshToken })
			});

			if (response.ok) {
				const data = await response.json();

				// Update stored tokens
				if (typeof window !== 'undefined') {
					localStorage.setItem('access_token', data.access_token);
					if (data.refresh_token) {
						localStorage.setItem('refresh_token', data.refresh_token);
					}
				}

				console.log('Token refreshed successfully');
				return true;
			} else {
				console.log('Refresh token failed:', response.status);
				return false;
			}
		} catch (error) {
			console.error('Refresh token error:', error);
			return false;
		}
	}

	// User profile related
	async getUserProfile() {
		return this.request<UserProfile>('/api/users/profile');
	}

	async createUserProfile(profile: {
		username?: string;
		display_name?: string;
		avatar_url?: string;
		preferences?: Record<string, unknown>;
	}) {
		return this.request<UserProfile>('/api/users/profile', {
			method: 'POST',
			body: JSON.stringify(profile)
		});
	}

	async updateUserProfile(profile: {
		username?: string;
		display_name?: string;
		avatar_url?: string;
		preferences?: Record<string, unknown>;
	}) {
		return this.request<UserProfile>('/api/users/profile', {
			method: 'PUT',
			body: JSON.stringify(profile)
		});
	}

	async deleteUserProfile() {
		return this.request('/api/users/profile', {
			method: 'DELETE'
		});
	}

	async getUserByUsername(username: string) {
		return this.request<UserProfile>(`/api/users/${username}`);
	}

	async listUsers(limit: number = 10, offset: number = 0) {
		return this.request<{
			users: UserProfile[];
			limit: number;
			offset: number;
			count: number;
		}>(`/api/users?limit=${limit}&offset=${offset}`);
	}

	// Notes related
	async createNote(note: { title: string; content: string; tags?: string[]; is_public?: boolean }) {
		return this.request<Note>('/api/notes', {
			method: 'POST',
			body: JSON.stringify(note)
		});
	}

	// Semantic search
	async searchNotes(query: string, threshold = 0.7, limit = 10) {
		return this.request<{ notes: SearchNotesItem[]; count: number }>(`/api/notes/search`, {
			method: 'POST',
			body: JSON.stringify({ query, threshold, limit })
		});
	}

	// Stream: Generate Flashcard based on query (using /query route, server responds with SSE wrapped JSON)
	streamFlashcardFromQuery(
		query: string,
		onMessage: (payload: unknown) => void,
		controller?: AbortController
	) {
		const aborter = controller ?? new AbortController();
		void this.streamSSE(`/api/notes/flashcard/query`, { query }, onMessage, aborter.signal).catch(
			(err: Error) => onMessage({ type: 'error', error: err?.message || 'stream error' })
		);
		return aborter;
	}

	// Stream: Generate Flashcard based on specified notes (using /notes route, server responds with SSE wrapped JSON)
	streamFlashcardFromNotes(
		noteIds: string[],
		onMessage: (payload: unknown) => void,
		controller?: AbortController
	) {
		const aborter = controller ?? new AbortController();
		void this.streamSSE(
			`/api/notes/flashcard/notes`,
			{ note_ids: noteIds },
			onMessage,
			aborter.signal
		).catch((err: Error) => onMessage({ type: 'error', error: err?.message || 'stream error' }));
		return aborter;
	}

	async getUserNotes(limit: number = 10, offset: number = 0) {
		return this.request<{
			notes: Note[];
			limit: number;
			offset: number;
			count: number;
		}>(`/api/notes?limit=${limit}&offset=${offset}`);
	}

	async getNote(id: string) {
		return this.request<Note>(`/api/notes/${id}`);
	}

	async updateNote(
		id: string,
		note: {
			title?: string;
			content?: string;
			tags?: string[];
			is_public?: boolean;
		}
	) {
		return this.request<Note>(`/api/notes/${id}`, {
			method: 'PUT',
			body: JSON.stringify(note)
		});
	}

	async deleteNote(id: string) {
		return this.request(`/api/notes/${id}`, {
			method: 'DELETE'
		});
	}

	async getPublicNotes(limit: number = 10, offset: number = 0) {
		return this.request<{
			notes: Note[];
			limit: number;
			offset: number;
			count: number;
		}>(`/api/notes/public?limit=${limit}&offset=${offset}`);
	}
}

// Export API client instance
export const api = new ApiClient();

// Authentication state management
export class AuthStore {
	private static instance: AuthStore;
	private user: User | null = null;
	private listeners: Array<(user: User | null) => void> = [];

	static getInstance(): AuthStore {
		if (!AuthStore.instance) {
			AuthStore.instance = new AuthStore();
		}
		return AuthStore.instance;
	}

	// Subscribe to user state changes
	subscribe(listener: (user: User | null) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	// Notify all listeners
	private notify() {
		this.listeners.forEach((listener) => listener(this.user));
	}

	// Set user
	setUser(user: User | null) {
		this.user = user;
		this.notify();
	}

	// Get current user
	getUser(): User | null {
		return this.user;
	}

	// Check if authenticated
	isAuthenticated(): boolean {
		return this.user !== null;
	}

	// Logout
	logout() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
		}
		this.setUser(null);
	}

	// Check if token is expired (based on JWT payload)
	private isTokenExpired(token: string): boolean {
		try {
			const base64Payload = token.split('.')[1];
			if (!base64Payload) return true;

			const paddedPayload = base64Payload + '='.repeat((4 - (base64Payload.length % 4)) % 4);
			const payload = JSON.parse(atob(paddedPayload));

			// Check exp field (expiration time in seconds)
			if (payload.exp) {
				const currentTime = Math.floor(Date.now() / 1000);
				return currentTime >= payload.exp;
			}

			return false;
		} catch {
			return true; // If unable to parse, consider expired
		}
	}

	// Initialize (check locally stored token)
	async initialize() {
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('access_token');
			if (token) {
				// First check if token is expired
				if (this.isTokenExpired(token)) {
					console.log('Token expired during initialization, attempting refresh...');

					// Try to refresh the token
					const refreshed = await api.refreshToken();
					if (!refreshed) {
						console.log('Refresh failed, logging out');
						this.logout();
						return;
					}

					console.log('Token refreshed successfully during initialization');
				}

				// Verify if token is still valid (this will auto-retry with refresh if needed)
				const response = await api.getCurrentUser();
				if (response.data) {
					this.setUser(response.data.user);
					// Trigger an event to notify that user profile has been loaded
					if (typeof window !== 'undefined') {
						window.dispatchEvent(
							new CustomEvent('user-profile-loaded', {
								detail: response.data.profile
							})
						);
					}
				} else {
					// Token invalid even after potential refresh, clear local storage
					console.log('Token validation failed, logging out');
					this.logout();
				}
			}
		}
	}

	// Periodically check token validity and refresh if needed
	startTokenValidationTimer() {
		if (typeof window !== 'undefined') {
			// Check token validity every 5 minutes
			setInterval(
				async () => {
					const token = localStorage.getItem('access_token');
					if (token && this.user) {
						if (this.isTokenExpired(token)) {
							console.log('Token expired during validation check, attempting refresh...');

							const refreshed = await api.refreshToken();
							if (!refreshed) {
								console.log('Periodic refresh failed, logging out');
								this.logout();
							} else {
								console.log('Token refreshed successfully during periodic check');
							}
						}
					}
				},
				5 * 60 * 1000
			); // 5 minutes
		}
	}
}

// Export authentication state management instance
export const authStore = AuthStore.getInstance();
