export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function formatDateTime(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
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
		return 'Today';
	} else if (diffInDays === 1) {
		return 'Yesterday';
	} else if (diffInDays < 7) {
		return `${diffInDays} days ago`;
	} else if (diffInDays < 30) {
		const weeks = Math.floor(diffInDays / 7);
		return `${weeks} weeks ago`;
	} else if (diffInDays < 365) {
		const months = Math.floor(diffInDays / 30);
		return `${months} months ago`;
	} else {
		const years = Math.floor(diffInDays / 365);
		return `${years} years ago`;
	}
}

export function getTimeDisplayText(
	createdAt: string,
	updatedAt: string
): { primary: string; secondary?: string } {
	const created = new Date(createdAt);
	const updated = new Date(updatedAt);

	const diffInMinutes = Math.abs(updated.getTime() - created.getTime()) / (1000 * 60);

	if (diffInMinutes > 1) {
		return {
			primary: formatRelativeTime(updatedAt),
			secondary: `Created on ${formatDate(createdAt)}`
		};
	} else {
		return {
			primary: formatRelativeTime(createdAt)
		};
	}
}
