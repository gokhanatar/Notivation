import { useState, useEffect, useCallback } from 'react';
import {
  getFolderTree,
  createFolder,
  updateFolder,
  deleteFolder,
  moveNoteToFolder,
  type FolderTreeNode,
} from '@/lib/folders/folderEngine';
import { db, type Folder } from '@/lib/db';

const folderListeners: Set<() => void> = new Set();

function notifyFolderListeners() {
  folderListeners.forEach(l => l());
}

export function useFolders() {
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [treeData, foldersData] = await Promise.all([
      getFolderTree(),
      db.folders.toArray(),
    ]);
    setTree(treeData);
    setAllFolders(foldersData);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    folderListeners.add(refresh);
    return () => { folderListeners.delete(refresh); };
  }, [refresh]);

  const addFolder = useCallback(async (name: string, parentId?: string, color?: string) => {
    await createFolder(name, parentId, color);
    notifyFolderListeners();
  }, []);

  const editFolder = useCallback(async (id: string, updates: Partial<Folder>) => {
    await updateFolder(id, updates);
    notifyFolderListeners();
  }, []);

  const removeFolder = useCallback(async (id: string) => {
    await deleteFolder(id);
    notifyFolderListeners();
  }, []);

  const moveNote = useCallback(async (noteId: string, folderId: string | undefined) => {
    await moveNoteToFolder(noteId, folderId);
    notifyFolderListeners();
  }, []);

  return { tree, allFolders, loading, refresh, addFolder, editFolder, removeFolder, moveNote };
}
