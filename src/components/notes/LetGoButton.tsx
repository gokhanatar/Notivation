import { Feather } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface LetGoButtonProps {
  onClick: () => void;
}

export function LetGoButton({ onClick }: LetGoButtonProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenuItem onClick={onClick}>
      <Feather className="w-4 h-4 mr-2" />
      {t('letgo.button')}
    </DropdownMenuItem>
  );
}
