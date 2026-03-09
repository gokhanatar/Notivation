import { db, type Note, type ActionItem, type Tag } from '@/lib/db';

/**
 * Export a single note as Markdown with YAML frontmatter
 */
function noteToMarkdown(note: Note, actionItems: ActionItem[], tags: Tag[]): string {
  const lines: string[] = [];

  // YAML frontmatter
  lines.push('---');
  lines.push(`type: ${note.type}`);
  lines.push(`created: ${new Date(note.createdAt).toISOString()}`);
  lines.push(`updated: ${new Date(note.updatedAt).toISOString()}`);
  if (note.mood) lines.push(`mood: ${note.mood}`);
  if (note.lifecycleStage) lines.push(`lifecycle: ${note.lifecycleStage}`);
  if (note.pinned) lines.push(`pinned: true`);
  if (note.dueDate) lines.push(`dueDate: ${new Date(note.dueDate).toISOString()}`);
  if (tags.length > 0) lines.push(`tags: [${tags.map(t => t.name).join(', ')}]`);
  if (note.decisionOutcome) lines.push(`outcome: ${note.decisionOutcome}`);
  lines.push('---');
  lines.push('');

  // Title
  if (note.title) {
    lines.push(`# ${note.title}`);
    lines.push('');
  }

  // Body
  if (note.body) {
    lines.push(note.body);
    lines.push('');
  }

  // Action items
  if (actionItems.length > 0) {
    lines.push('## Action Items');
    lines.push('');
    for (const item of actionItems) {
      const checkbox = item.isDone ? '[x]' : '[ ]';
      let line = `- ${checkbox} ${item.text}`;
      if (item.dueDate) {
        line += ` (due: ${new Date(item.dueDate).toLocaleDateString()})`;
      }
      lines.push(line);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Export all notes as a single Markdown file
 */
export async function exportAllAsMarkdown(): Promise<string> {
  const [notes, allActions, tags, noteTags] = await Promise.all([
    db.notes.toArray(),
    db.actionItems.toArray(),
    db.tags.toArray(),
    db.noteTags.toArray(),
  ]);

  const tagMap = new Map(tags.map(t => [t.id, t]));

  const sections: string[] = [];

  for (const note of notes.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )) {
    const noteActions = allActions
      .filter(a => a.noteId === note.id)
      .sort((a, b) => a.order - b.order);

    const noteTagIds = noteTags
      .filter(nt => nt.noteId === note.id)
      .map(nt => tagMap.get(nt.tagId))
      .filter(Boolean) as Tag[];

    sections.push(noteToMarkdown(note, noteActions, noteTagIds));
  }

  return sections.join('\n---\n\n');
}

/**
 * Download markdown export as a file
 */
export async function downloadMarkdownExport(): Promise<void> {
  const content = await exportAllAsMarkdown();
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notivation-export-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
