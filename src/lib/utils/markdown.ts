import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked options
marked.setOptions({
	breaks: true, // Convert line breaks to <br>
	gfm: true // Enable GitHub Flavored Markdown
});

/**
 * Render markdown text to HTML safely
 */
export function renderMarkdown(text: string): string {
	if (!text) return '';
	const html = marked(text) as string;
	return DOMPurify.sanitize(html);
}
