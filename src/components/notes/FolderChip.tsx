import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Folder } from 'lucide-react';

interface FolderChipProps {
  folderId: string;
}

export function FolderChip({ folderId }: FolderChipProps) {
  const [folderName, setFolderName] = useState<string | null>(null);

  useEffect(() => {
    db.folders.get(folderId).then(f => {
      if (f) setFolderName(f.name);
    });
  }, [folderId]);

  if (!folderName) return null;

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
      <Folder className="w-2.5 h-2.5" />
      <span className="truncate max-w-[60px]">{folderName}</span>
    </span>
  );
}
