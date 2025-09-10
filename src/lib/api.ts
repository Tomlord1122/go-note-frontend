// API 配置和工具函數

// API 基礎 URL
export const API_BASE = 'http://localhost:8080';

// API 響應類型
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

export interface OAuthResponse {
	url: string;
	message: string;
}

// API 請求工具函數
class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE) {
		this.baseUrl = baseUrl;
	}

	// 獲取認證 headers
	private getAuthHeaders(): HeadersInit {
		const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
		return {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` })
		};
	}

	// 通用請求方法
	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				headers: this.getAuthHeaders(),
				...options
			});

			// 處理 204 No Content 響應（如 DELETE 操作）
			if (response.status === 204) {
				return { data: {} as T };
			}

			// 嘗試解析 JSON，如果失敗則返回空對象
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
				error: error instanceof Error ? error.message : '網路錯誤'
			};
		}
	}

	// 健康檢查
	async healthCheck() {
		return this.request('/health');
	}

	// 認證相關
	async initiateGoogleLogin(redirectUrl: string = 'http://localhost:5173') {
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

	// 用戶資料相關
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

	// 筆記相關
	async createNote(note: { title: string; content: string; tags?: string[]; is_public?: boolean }) {
		return this.request<Note>('/api/notes', {
			method: 'POST',
			body: JSON.stringify(note)
		});
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

// 導出 API 客戶端實例
export const api = new ApiClient();

// 認證狀態管理
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

	// 訂閱用戶狀態變化
	subscribe(listener: (user: User | null) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	// 通知所有監聽者
	private notify() {
		this.listeners.forEach((listener) => listener(this.user));
	}

	// 設置用戶
	setUser(user: User | null) {
		this.user = user;
		this.notify();
	}

	// 獲取當前用戶
	getUser(): User | null {
		return this.user;
	}

	// 檢查是否已登錄
	isAuthenticated(): boolean {
		return this.user !== null;
	}

	// 登出
	logout() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
		}
		this.setUser(null);
	}

	// 初始化（檢查本地存儲的 token）
	async initialize() {
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('access_token');
			if (token) {
				const response = await api.getCurrentUser();
				if (response.data) {
					this.setUser(response.data.user);
					// 觸發一個事件來通知用戶資料已加載
					if (typeof window !== 'undefined') {
						window.dispatchEvent(
							new CustomEvent('user-profile-loaded', {
								detail: response.data.profile
							})
						);
					}
				} else {
					// token 無效，清理本地存儲
					this.logout();
				}
			}
		}
	}
}

// 導出認證狀態管理實例
export const authStore = AuthStore.getInstance();
