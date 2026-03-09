import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useUIStore } from '@/store/useStore';
import { builtInTemplates, type BuiltInTemplate } from '@/lib/templates/builtInTemplates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock } from 'lucide-react';

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: BuiltInTemplate) => void;
}

export function TemplatePicker({ open, onOpenChange, onSelect }: TemplatePickerProps) {
  const { t } = useTranslation();
  const isPro = useUIStore((s) => s.isPro);

  const handleSelect = (template: BuiltInTemplate) => {
    if (!isPro) {
      useUIStore.getState().setProModalFeature(t('pro.templates'));
      useUIStore.getState().setShowProModal(true);
      onOpenChange(false);
      return;
    }
    onSelect(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('templates.title')}
            {!isPro && <Lock className="w-4 h-4 text-muted-foreground" />}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {builtInTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect(template)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl',
                'border border-border bg-card',
                'hover:border-primary/50 hover:bg-accent/50',
                'transition-all tap-target press-effect text-center'
              )}
            >
              <span className="text-2xl">{template.icon}</span>
              <span className="text-sm font-medium">{t(template.nameKey)}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {t(template.descriptionKey)}
              </span>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
