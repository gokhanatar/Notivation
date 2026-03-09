import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { downloadBackup, pickAndImportBackup } from '@/lib/backup/exportImport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BackupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function BackupModal({ open, onOpenChange, onImportComplete }: BackupModalProps) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadBackup();
      toast.success(t('backup.exportSuccess'));
    } catch (err) {
      toast.error(t('backup.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await pickAndImportBackup();
      if (result.success) {
        const total = Object.values(result.counts).reduce((a, b) => a + b, 0);
        toast.success(t('backup.importSuccess', { count: total }));
        onImportComplete?.();
        onOpenChange(false);
        // Reload the page to refresh all data
        window.location.reload();
      }
    } catch (err) {
      if ((err as Error).message !== 'No file selected') {
        toast.error(t('backup.importError'));
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>{t('backup.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {t('backup.description')}
          </p>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={handleExport}
              disabled={exporting || importing}
            >
              {exporting ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <Download className="w-5 h-5 mr-3" />
              )}
              <div className="text-left">
                <div className="font-medium">{t('backup.export')}</div>
                <div className="text-xs text-muted-foreground">{t('backup.exportDesc')}</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={handleImport}
              disabled={exporting || importing}
            >
              {importing ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 mr-3" />
              )}
              <div className="text-left">
                <div className="font-medium">{t('backup.import')}</div>
                <div className="text-xs text-muted-foreground">{t('backup.importDesc')}</div>
              </div>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t('backup.note')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
