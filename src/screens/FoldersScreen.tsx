import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useFolders } from '@/hooks/useFolders';
import { getNotesInFolder } from '@/lib/folders/folderEngine';
import { type FolderTreeNode } from '@/lib/folders/folderEngine';
import { type Note } from '@/lib/db';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { TypeBadge } from '@/components/notes/TypeBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

interface FoldersScreenProps {
  onBack: () => void;
  onNoteSelect: (noteId: string) => void;
}

export function FoldersScreen({ onBack, onNoteSelect }: FoldersScreenProps) {
  const { t } = useTranslation();
  const { tree, loading, addFolder, removeFolder } = useFolders();

  // Dialog state for creating folders
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>();
  const [newFolderName, setNewFolderName] = useState('');

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreateFolder = useCallback(async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    await addFolder(trimmed, createParentId);
    setNewFolderName('');
    setCreateDialogOpen(false);
    setCreateParentId(undefined);
  }, [newFolderName, createParentId, addFolder]);

  const handleDeleteFolder = useCallback(async () => {
    if (!deleteConfirmId) return;
    await removeFolder(deleteConfirmId);
    setDeleteConfirmId(null);
  }, [deleteConfirmId, removeFolder]);

  const openCreateDialog = useCallback((parentId?: string) => {
    setCreateParentId(parentId);
    setNewFolderName('');
    setCreateDialogOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center tap-target flex-shrink-0"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{t('folders.title')}</h1>
        </div>
        <Button
          size="sm"
          onClick={() => openCreateDialog()}
          className="gap-1.5"
        >
          <FolderPlus className="w-4 h-4" />
          {t('folders.newFolder')}
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('folders.empty')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('folders.emptyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {tree.map(node => (
                <FolderItem
                  key={node.folder.id}
                  node={node}
                  level={0}
                  onAddSubfolder={openCreateDialog}
                  onDelete={setDeleteConfirmId}
                  onNoteSelect={onNoteSelect}
                  t={t}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create folder dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createParentId ? t('folders.addSubfolder') : t('folders.newFolder')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder={t('folders.folderName')}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              {t('folders.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('folders.deleteFolder')}</AlertDialogTitle>
            <AlertDialogDescription>{t('folders.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==========================================
// FolderItem (recursive tree node)
// ==========================================

interface FolderItemProps {
  node: FolderTreeNode;
  level: number;
  onAddSubfolder: (parentId: string) => void;
  onDelete: (id: string) => void;
  onNoteSelect: (noteId: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function FolderItem({ node, level, onAddSubfolder, onDelete, onNoteSelect, t }: FolderItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleShowNotes = useCallback(async () => {
    if (showNotes) {
      setShowNotes(false);
      return;
    }
    setLoadingNotes(true);
    const folderNotes = await getNotesInFolder(node.folder.id);
    setNotes(folderNotes);
    setShowNotes(true);
    setLoadingNotes(false);
  }, [showNotes, node.folder.id]);

  const hasChildren = node.children.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div
        className={cn(
          'flex items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors',
        )}
        style={{ marginLeft: level * 20 }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={handleToggle}
          className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        {/* Folder icon */}
        {expanded ? (
          <FolderOpen className="w-5 h-5 flex-shrink-0" style={{ color: node.folder.color || 'hsl(var(--primary))' }} />
        ) : (
          <Folder className="w-5 h-5 flex-shrink-0" style={{ color: node.folder.color || 'hsl(var(--primary))' }} />
        )}

        {/* Folder name */}
        <span className="flex-1 font-medium text-sm truncate">{node.folder.name}</span>

        {/* Note count */}
        {node.noteCount > 0 && (
          <button
            onClick={handleShowNotes}
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded bg-muted"
          >
            {loadingNotes ? '...' : t('folders.notesCount', { count: node.noteCount })}
          </button>
        )}

        {/* Add subfolder */}
        <button
          onClick={() => onAddSubfolder(node.folder.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          aria-label={t('folders.addSubfolder')}
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>

        {/* Delete folder */}
        <button
          onClick={() => onDelete(node.folder.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label={t('folders.deleteFolder')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inline notes */}
      <AnimatePresence>
        {showNotes && notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            style={{ marginLeft: (level + 1) * 20 }}
          >
            <div className="space-y-1 py-1">
              {notes.map(note => (
                <button
                  key={note.id}
                  onClick={() => onNoteSelect(note.id)}
                  className="w-full text-left p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <TypeBadge type={note.type} size="sm" />
                  <span className="text-sm truncate flex-1">
                    {getDisplayTitle(note.title, note.body)}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 py-1">
              {node.children.map(child => (
                <FolderItem
                  key={child.folder.id}
                  node={child}
                  level={level + 1}
                  onAddSubfolder={onAddSubfolder}
                  onDelete={onDelete}
                  onNoteSelect={onNoteSelect}
                  t={t}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
