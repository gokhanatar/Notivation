import { useState, useEffect } from 'react';
import { getFolderPath } from '@/lib/folders/folderEngine';
import { type Folder } from '@/lib/db';
import { ChevronRight } from 'lucide-react';

interface FolderBreadcrumbProps {
  folderId: string;
  onFolderClick?: (folderId: string) => void;
}

export function FolderBreadcrumb({ folderId, onFolderClick }: FolderBreadcrumbProps) {
  const [path, setPath] = useState<Folder[]>([]);

  useEffect(() => {
    getFolderPath(folderId).then(setPath);
  }, [folderId]);

  if (path.length === 0) return null;

  return (
    <div className="text-xs text-muted-foreground flex items-center gap-1">
      {path.map((folder, index) => (
        <span key={folder.id} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          {onFolderClick ? (
            <button
              onClick={() => onFolderClick(folder.id)}
              className="hover:text-primary transition-colors truncate max-w-[100px]"
            >
              {folder.name}
            </button>
          ) : (
            <span className="truncate max-w-[100px]">{folder.name}</span>
          )}
        </span>
      ))}
    </div>
  );
}
