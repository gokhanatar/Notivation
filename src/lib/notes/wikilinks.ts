import type { Note } from '@/lib/db';

/**
 * Extract all [[wikilink]] references from text.
 * Returns array of note titles referenced.
 */
export function parseWikilinks(text: string): string[] {
  const matches = text.matchAll(/\[\[([^\]]+)\]\]/g);
  return Array.from(matches, (m) => m[1]);
}

/**
 * Resolve a wikilink title to an actual note.
 * Case-insensitive matching on title first, then body first line.
 */
export function resolveWikilink(title: string, notes: Note[]): Note | undefined {
  const lower = title.toLowerCase().trim();

  // Try exact title match first
  const byTitle = notes.find(
    (n) => n.title.toLowerCase().trim() === lower
  );
  if (byTitle) return byTitle;

  // Try body first line match
  const byBody = notes.find((n) => {
    const firstLine = n.body.split('\n')[0]?.trim().toLowerCase();
    return firstLine === lower;
  });
  if (byBody) return byBody;

  // Try partial title match
  return notes.find(
    (n) => n.title.toLowerCase().includes(lower) || lower.includes(n.title.toLowerCase())
  );
}

/**
 * Find all notes that link to a given note (backlinks).
 */
export function findBacklinks(noteTitle: string, allNotes: Note[]): Note[] {
  const lower = noteTitle.toLowerCase().trim();

  return allNotes.filter((note) => {
    const links = parseWikilinks(note.body);
    return links.some((link) => link.toLowerCase().trim() === lower);
  });
}

/**
 * Check if text contains any wikilinks.
 */
export function hasWikilinks(text: string): boolean {
  return /\[\[([^\]]+)\]\]/.test(text);
}
