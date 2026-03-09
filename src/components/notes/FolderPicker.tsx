import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useFolders } from '@/hooks/useFolders';
import { type FolderTreeNode } from '@/lib/folders/folderEngine';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Folder } from 'lucide-react';

interface FolderPickerProps {
  currentFolderId?: string;
  onSelect: (folderId: string | undefined) => void;
}

export function FolderPicker({ currentFolderId, onSelect }: FolderPickerProps) {
  const { t } = useTranslation();
  const { tree, loading } = useFolders();
  const [open, setOpen] = useState(false);

  const handleSelect = (folderId: string | undefined) => {
    onSelect(folderId);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Folder className="w-3.5 h-3.5" />
        {t('folders.pickFolder')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('folders.pickFolder')}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-1 py-2">
            {/* No folder option */}
            <button
              onClick={() => handleSelect(undefined)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm',
                !currentFolderId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <Folder className="w-4 h-4" />
              {t('folders.noFolder')}
            </button>

            {/* Folder tree */}
            {!loading && tree.map(node => (
              <FolderPickerItem
                key={node.folder.id}
                node={node}
                level={0}
                currentFolderId={currentFolderId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==========================================
// FolderPickerItem (recursive)
// ==========================================

interface FolderPickerItemProps {
  node: FolderTreeNode;
  level: number;
  currentFolderId?: string;
  onSelect: (folderId: string) => void;
}

function FolderPickerItem({ node, level, currentFolderId, onSelect }: FolderPickerItemProps) {
  const isSelected = currentFolderId === node.folder.id;

  return (
    <>
      <button
        onClick={() => onSelect(node.folder.id)}
        className={cn(
          'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm',
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-muted'
        )}
        style={{ paddingLeft: 12 + level * 20 }}
      >
        <Folder
          className="w-4 h-4 flex-shrink-0"
          style={{ color: node.folder.color || undefined }}
        />
        <span className="truncate">{node.folder.name}</span>
      </button>

      {node.children.map(child => (
        <FolderPickerItem
          key={child.folder.id}
          node={child}
          level={level + 1}
          currentFolderId={currentFolderId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
