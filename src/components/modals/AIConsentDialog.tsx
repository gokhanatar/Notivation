import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, X } from 'lucide-react';

const PRIVACY_URLS: Record<string, string> = {
  gemini: 'https://ai.google.dev/gemini-api/terms',
  openai: 'https://openai.com/policies/privacy-policy',
  anthropic: 'https://www.anthropic.com/privacy',
};

interface AIConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentDialog({ open, onAccept, onDecline }: AIConsentDialogProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm"
            onClick={onDecline}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[71] max-w-md mx-auto bg-card border border-border rounded-2xl shadow-xl p-6"
          >
            <button
              onClick={onDecline}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-bold">{t('ai.consentTitle')}</h2>
              <p className="text-sm text-muted-foreground mt-2">
                {t('ai.consentDesc')}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-1">{t('ai.consentWhatData')}</p>
                <p className="text-muted-foreground text-xs">{t('ai.consentWhatDataDesc')}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-1">{t('ai.consentWhoReceives')}</p>
                <p className="text-muted-foreground text-xs">{t('ai.consentWhoReceivesDesc')}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('ai.consentPrivacyLinks')}</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(PRIVACY_URLS).map(([provider, url]) => (
                  <a
                    key={provider}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {provider === 'gemini' ? 'Google Gemini' : provider === 'openai' ? 'OpenAI' : 'Anthropic'} — {t('ai.consentPrivacyPolicy')}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onDecline}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={onAccept}
              >
                {t('ai.consentAccept')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
