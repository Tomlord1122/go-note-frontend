// 日期格式化工具函數

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('zh-TW', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function formatDateTime(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('zh-TW', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	if (diffInDays === 0) {
		return '今天';
	} else if (diffInDays === 1) {
		return '昨天';
	} else if (diffInDays < 7) {
		return `${diffInDays} 天前`;
	} else if (diffInDays < 30) {
		const weeks = Math.floor(diffInDays / 7);
		return `${weeks} 週前`;
	} else if (diffInDays < 365) {
		const months = Math.floor(diffInDays / 30);
		return `${months} 個月前`;
	} else {
		const years = Math.floor(diffInDays / 365);
		return `${years} 年前`;
	}
}

export function getTimeDisplayText(
	createdAt: string,
	updatedAt: string
): { primary: string; secondary?: string } {
	const created = new Date(createdAt);
	const updated = new Date(updatedAt);

	// 如果創建時間和更新時間相差超過 1 分鐘，顯示更新時間
	const diffInMinutes = Math.abs(updated.getTime() - created.getTime()) / (1000 * 60);

	if (diffInMinutes > 1) {
		return {
			primary: formatRelativeTime(updatedAt),
			secondary: `創建於 ${formatDate(createdAt)}`
		};
	} else {
		return {
			primary: formatRelativeTime(createdAt)
		};
	}
}
