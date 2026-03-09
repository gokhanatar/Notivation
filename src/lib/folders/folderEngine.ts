import { db, type Folder, type Note } from '@/lib/db';

export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  noteCount: number;
}

export async function createFolder(name: string, parentId?: string, color?: string, icon?: string): Promise<Folder> {
  const now = new Date();
  const siblings = parentId
    ? await db.folders.where('parentId').equals(parentId).toArray()
    : await db.folders.filter(f => !f.parentId).toArray();

  const folder: Folder = {
    id: crypto.randomUUID(),
    name,
    parentId,
    color,
    icon,
    order: siblings.length,
    createdAt: now,
    updatedAt: now,
  };
  await db.folders.add(folder);
  return folder;
}

export async function updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
  await db.folders.update(id, { ...updates, updatedAt: new Date() });
}

export async function deleteFolder(id: string): Promise<void> {
  // Move notes in this folder to no folder
  await db.notes.where('folderId').equals(id).modify({ folderId: undefined });
  // Recursively delete child folders
  const children = await db.folders.where('parentId').equals(id).toArray();
  for (const child of children) {
    await deleteFolder(child.id);
  }
  await db.folders.delete(id);
}

export async function getFolderTree(): Promise<FolderTreeNode[]> {
  const allFolders = await db.folders.toArray();
  const allNotes = await db.notes.filter(n => !n.archived && !!n.folderId).toArray();

  const noteCountMap: Record<string, number> = {};
  for (const note of allNotes) {
    if (note.folderId) {
      noteCountMap[note.folderId] = (noteCountMap[note.folderId] || 0) + 1;
    }
  }

  function buildTree(parentId?: string): FolderTreeNode[] {
    return allFolders
      .filter(f => (parentId ? f.parentId === parentId : !f.parentId))
      .sort((a, b) => a.order - b.order)
      .map(folder => ({
        folder,
        children: buildTree(folder.id),
        noteCount: noteCountMap[folder.id] || 0,
      }));
  }

  return buildTree();
}

export async function getFolderPath(folderId: string): Promise<Folder[]> {
  const path: Folder[] = [];
  let currentId: string | undefined = folderId;

  while (currentId) {
    const folder = await db.folders.get(currentId);
    if (!folder) break;
    path.unshift(folder);
    currentId = folder.parentId;
  }

  return path;
}

export async function getNotesInFolder(folderId: string, includeSubfolders: boolean = false): Promise<Note[]> {
  if (!includeSubfolders) {
    return db.notes.where('folderId').equals(folderId).filter(n => !n.archived).toArray();
  }

  // Get all subfolder IDs recursively
  const folderIds = [folderId];
  const allFolders = await db.folders.toArray();

  function collectChildren(parentId: string) {
    const children = allFolders.filter(f => f.parentId === parentId);
    for (const child of children) {
      folderIds.push(child.id);
      collectChildren(child.id);
    }
  }
  collectChildren(folderId);

  return db.notes.filter(n => !n.archived && !!n.folderId && folderIds.includes(n.folderId)).toArray();
}

export async function moveNoteToFolder(noteId: string, folderId: string | undefined): Promise<void> {
  await db.notes.update(noteId, { folderId, updatedAt: new Date() });
}

export async function moveFolderToParent(folderId: string, newParentId: string | undefined): Promise<void> {
  await db.folders.update(folderId, { parentId: newParentId, updatedAt: new Date() });
}
