/**
 * Generates an automatic title from content text
 * Rules:
 * - Trim and normalize whitespace
 * - Take first line if multi-line
 * - Extract first 2-3 words
 * - Max 40 characters, add "…" if truncated
 * - Clean punctuation/emojis from end
 */
export function generateAutoTitle(content: string): string {
  if (!content || !content.trim()) {
    return '';
  }

  // Trim and normalize whitespace
  let text = content.trim().replace(/\s+/g, ' ');

  // Take first line if multi-line
  const firstLine = text.split('\n')[0].trim();
  text = firstLine || text;

  // Split into words
  const words = text.split(' ').filter(Boolean);

  if (words.length === 0) {
    return '';
  }

  // Take first 2-3 words
  // Use 2 words if they're long enough, 3 if first words are short
  let wordCount = 2;
  if (words.length >= 3) {
    const firstTwoLength = words.slice(0, 2).join(' ').length;
    if (firstTwoLength < 15) {
      wordCount = 3;
    }
  }

  let title = words.slice(0, Math.min(wordCount, words.length)).join(' ');

  // Clean trailing punctuation (keep emojis at start but clean end)
  title = title.replace(/[.,;:!?…\-_]+$/, '').trim();

  // Max 40 characters
  if (title.length > 40) {
    title = title.substring(0, 37).trim() + '…';
  } else if (words.length > wordCount) {
    // Add ellipsis if there's more content
    title = title + '…';
  }

  return title;
}

/**
 * Gets the display title for a note
 * Uses manual title if set, otherwise generates from content
 */
export function getDisplayTitle(title: string | null | undefined, content: string): string {
  // If user has set a title, use it
  if (title && title.trim()) {
    return title.trim();
  }

  // Generate from content
  return generateAutoTitle(content) || 'Untitled';
}
