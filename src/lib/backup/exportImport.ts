import { db } from '@/lib/db';
import { isNative } from '@/lib/capacitor';

interface BackupData {
  version: 3 | 4 | 5;
  exportedAt: string;
  data: {
    notes: any[];
    actionItems: any[];
    tags: any[];
    noteTags: any[];
    settings: any[];
    actionEvents: any[];
    templates: any[];
    decisionItems?: any[];
  };
}

export async function exportAllData(): Promise<BackupData> {
  const [notes, actionItems, tags, noteTags, settings, actionEvents, templates, decisionItems] = await Promise.all([
    db.notes.toArray(),
    db.actionItems.toArray(),
    db.tags.toArray(),
    db.noteTags.toArray(),
    db.settings.toArray(),
    db.actionEvents.toArray(),
    db.templates.toArray(),
    db.decisionItems.toArray(),
  ]);

  return {
    version: 5,
    exportedAt: new Date().toISOString(),
    data: {
      notes,
      actionItems,
      tags,
      noteTags,
      settings,
      actionEvents,
      templates,
      decisionItems,
    },
  };
}

export async function importData(backup: BackupData): Promise<{ success: boolean; counts: Record<string, number> }> {
  if (!backup.version || !backup.data) {
    throw new Error('Invalid backup file format');
  }

  const counts: Record<string, number> = {};

  await db.transaction('rw',
    [db.notes, db.actionItems, db.tags, db.noteTags, db.settings, db.actionEvents, db.templates, db.decisionItems],
    async () => {
      // Clear existing data
      await Promise.all([
        db.notes.clear(),
        db.actionItems.clear(),
        db.tags.clear(),
        db.noteTags.clear(),
        db.actionEvents.clear(),
        db.templates.clear(),
        db.decisionItems.clear(),
      ]);

      // Import new data
      if (backup.data.notes?.length) {
        // Convert date strings back to Date objects
        const notes = backup.data.notes.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
          dueDate: n.dueDate ? new Date(n.dueDate) : undefined,
          reminderDate: n.reminderDate ? new Date(n.reminderDate) : undefined,
          lifecyclePromotedAt: n.lifecyclePromotedAt ? new Date(n.lifecyclePromotedAt) : undefined,
        }));
        await db.notes.bulkAdd(notes);
        counts.notes = notes.length;
      }

      if (backup.data.actionItems?.length) {
        const items = backup.data.actionItems.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
          dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
        }));
        await db.actionItems.bulkAdd(items);
        counts.actionItems = items.length;
      }

      if (backup.data.tags?.length) {
        await db.tags.bulkAdd(backup.data.tags);
        counts.tags = backup.data.tags.length;
      }

      if (backup.data.noteTags?.length) {
        await db.noteTags.bulkAdd(backup.data.noteTags);
        counts.noteTags = backup.data.noteTags.length;
      }

      if (backup.data.actionEvents?.length) {
        const events = backup.data.actionEvents.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
        await db.actionEvents.bulkAdd(events);
        counts.actionEvents = events.length;
      }

      if (backup.data.templates?.length) {
        const templates = backup.data.templates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }));
        await db.templates.bulkAdd(templates);
        counts.templates = templates.length;
      }

      if (backup.data.decisionItems?.length) {
        const decisionItems = backup.data.decisionItems.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
        }));
        await db.decisionItems.bulkAdd(decisionItems);
        counts.decisionItems = decisionItems.length;
      }

      // Restore settings (merge, don't clear)
      if (backup.data.settings?.length) {
        for (const setting of backup.data.settings) {
          await db.settings.put({
            ...setting,
            lastActiveAt: new Date(setting.lastActiveAt),
          });
        }
        counts.settings = backup.data.settings.length;
      }
    }
  );

  return { success: true, counts };
}

export async function downloadBackup(): Promise<void> {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `notivation-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function pickAndImportBackup(): Promise<{ success: boolean; counts: Record<string, number> }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const backup = JSON.parse(text) as BackupData;
        const result = await importData(backup);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    input.click();
  });
}
