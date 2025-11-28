/**
 * Convert Markdown to Slack mrkdwn format
 *
 * Slack mrkdwn differences from Markdown:
 * - Bold: *text* (not **text**)
 * - Italic: _text_ (same)
 * - Links: <url|text> (not [text](url))
 * - No headers (# ignored, convert to bold)
 * - Code: `code` and ```blocks``` (same)
 */
export function markdownToMrkdwn(text: string): string {
	// Preserve code blocks by replacing them with placeholders
	// Use \x00 (null) markers to avoid matching bold/italic patterns
	const codeBlocks: string[] = [];
	let result = text.replace(/```[\s\S]*?```/g, (match) => {
		codeBlocks.push(match);
		return `\x00CB${codeBlocks.length - 1}\x00`;
	});

	// Preserve inline code
	const inlineCode: string[] = [];
	result = result.replace(/`[^`]+`/g, (match) => {
		inlineCode.push(match);
		return `\x00IC${inlineCode.length - 1}\x00`;
	});

	// Convert **bold** and __bold__ to *bold*
	result = result.replace(/\*\*([^*]+)\*\*/g, "*$1*");
	result = result.replace(/__([^_]+)__/g, "*$1*");

	// Convert [text](url) to <url|text>
	result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<$2|$1>");

	// Convert headers to bold (# Header -> *Header*)
	result = result.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

	// Restore inline code
	for (let i = 0; i < inlineCode.length; i++) {
		result = result.replace(`\x00IC${i}\x00`, inlineCode[i]);
	}

	// Restore code blocks
	for (let i = 0; i < codeBlocks.length; i++) {
		result = result.replace(`\x00CB${i}\x00`, codeBlocks[i]);
	}

	return result;
}
