import { FileText, CheckCircle, Eye } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface StruggleZoneSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickNote: () => void;
  onCompleteAction: () => void;
  onReviewNote: () => void;
}

export function StruggleZoneSheet({
  open,
  onOpenChange,
  onQuickNote,
  onCompleteAction,
  onReviewNote,
}: StruggleZoneSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle>{t('momentum.struggleTitle')}</SheetTitle>
          <SheetDescription>{t('momentum.struggleDesc')}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-16 justify-start gap-4 text-left"
            onClick={() => {
              onQuickNote();
              onOpenChange(false);
            }}
          >
            <FileText className="w-6 h-6 text-blue-500 shrink-0" />
            <span className="text-base font-medium">{t('momentum.quickNote')}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-16 justify-start gap-4 text-left"
            onClick={() => {
              onCompleteAction();
              onOpenChange(false);
            }}
          >
            <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
            <span className="text-base font-medium">{t('momentum.completeAction')}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-16 justify-start gap-4 text-left"
            onClick={() => {
              onReviewNote();
              onOpenChange(false);
            }}
          >
            <Eye className="w-6 h-6 text-purple-500 shrink-0" />
            <span className="text-base font-medium">{t('momentum.reviewNote')}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
