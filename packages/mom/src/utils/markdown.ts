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
	const codeBlocks: string[] = [];
	let result = text.replace(/```[\s\S]*?```/g, (match) => {
		codeBlocks.push(match);
		return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
	});

	// Preserve inline code
	const inlineCode: string[] = [];
	result = result.replace(/`[^`]+`/g, (match) => {
		inlineCode.push(match);
		return `__INLINE_CODE_${inlineCode.length - 1}__`;
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
		result = result.replace(`__INLINE_CODE_${i}__`, inlineCode[i]);
	}

	// Restore code blocks
	for (let i = 0; i < codeBlocks.length; i++) {
		result = result.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
	}

	return result;
}
