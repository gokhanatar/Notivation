import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { isNative } from '@/lib/capacitor';
import { purchasePro, restorePurchases, activateProLocally, fetchStoreProducts, StoreProduct, PRODUCT_IDS } from '@/lib/native/purchases';
import { activateProWithCode } from '@/lib/promoCode';
import { getPricingPlans, PlanType } from '@/lib/currency';
import { toast } from 'sonner';
import { hapticSuccess, hapticError } from '@/lib/native/haptics';
import {
  X,
  Lock,
  History,
  Layers,
  Download,
  Search,
  Sparkles,
  Palette,
  BarChart3,
  Paperclip,
  FileText,
  Trash2,
  Link2,
  Calendar,
  Keyboard,
  Database,
  Smile,
  Flame,
  Timer,
  Mic,
  Eye,
  Network,
  BookOpen,
  Zap,
  Type,
  TrendingUp,
  Crown,
  Check
} from 'lucide-react';

const proFeatures = [
  { icon: Lock, titleKey: 'pro.appLock', descKey: 'pro.appLockDesc' },
  { icon: History, titleKey: 'pro.history', descKey: 'pro.historyDesc' },
  { icon: Layers, titleKey: 'pro.customViews', descKey: 'pro.customViewsDesc' },
  { icon: BarChart3, titleKey: 'pro.analytics', descKey: 'pro.analyticsDesc' },
  { icon: Smile, titleKey: 'pro.moodTracking', descKey: 'pro.moodTrackingDesc' },
  { icon: Flame, titleKey: 'pro.streaks', descKey: 'pro.streaksDesc' },
  { icon: Timer, titleKey: 'pro.focusMode', descKey: 'pro.focusModeDesc' },
  { icon: Paperclip, titleKey: 'pro.attachments', descKey: 'pro.attachmentsDesc' },
  { icon: Palette, titleKey: 'pro.themes', descKey: 'pro.themesDesc' },
  { icon: FileText, titleKey: 'pro.templates', descKey: 'pro.templatesDesc' },
  { icon: Mic, titleKey: 'pro.voiceMemos', descKey: 'pro.voiceMemosDesc' },
  { icon: Eye, titleKey: 'pro.markdownPreview', descKey: 'pro.markdownPreviewDesc' },
  { icon: Network, titleKey: 'pro.noteGraph', descKey: 'pro.noteGraphDesc' },
  { icon: BookOpen, titleKey: 'pro.readingMode', descKey: 'pro.readingModeDesc' },
  { icon: Download, titleKey: 'pro.export', descKey: 'pro.exportDesc' },
  { icon: Search, titleKey: 'pro.advancedSearch', descKey: 'pro.advancedSearchDesc' },
  { icon: Link2, titleKey: 'pro.noteLinking', descKey: 'pro.noteLinkingDesc' },
  { icon: Calendar, titleKey: 'pro.calendarView', descKey: 'pro.calendarViewDesc' },
  { icon: Keyboard, titleKey: 'pro.shortcuts', descKey: 'pro.shortcutsDesc' },
  { icon: Trash2, titleKey: 'pro.trashRecovery', descKey: 'pro.trashRecoveryDesc' },
  { icon: Database, titleKey: 'pro.bulkOperations', descKey: 'pro.bulkOperationsDesc' },
  { icon: Zap, titleKey: 'pro.quickCapture', descKey: 'pro.quickCaptureDesc' },
  { icon: Type, titleKey: 'pro.customFonts', descKey: 'pro.customFontsDesc' },
  { icon: TrendingUp, titleKey: 'pro.writingStats', descKey: 'pro.writingStatsDesc' },
];

export function ProModal() {
  const { t } = useTranslation();
  const { showProModal, setShowProModal, proModalFeature, setIsPro } = useUIStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch real prices from App Store / Google Play on native
  useEffect(() => {
    if (showProModal && isNative) {
      setProductsLoading(true);
      fetchStoreProducts()
        .then(products => setStoreProducts(products))
        .catch(() => {}) // silently ignore fetch errors
        .finally(() => setProductsLoading(false));
    }
  }, [showProModal]);

  // On native: use real store prices if available, fallback to hardcoded
  const fallbackPlans = getPricingPlans();
  const plans = isNative && storeProducts.length > 0
    ? fallbackPlans.map(plan => {
        const storeProduct = storeProducts.find(p => p.id === PRODUCT_IDS[plan.type]);
        if (storeProduct) {
          return { ...plan, priceString: storeProduct.displayPrice, price: storeProduct.price };
        }
        return plan;
      })
    : fallbackPlans;

  // Check if native store products are available (required for purchase)
  const canPurchase = !isNative || storeProducts.length > 0;

  const retryLoadProducts = async () => {
    setProductsLoading(true);
    try {
      const products = await fetchStoreProducts();
      setStoreProducts(products);
    } finally {
      setProductsLoading(false);
    }
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      if (isNative) {
        const success = await purchasePro(selectedPlan);
        if (success) {
          activateProLocally(selectedPlan);
          hapticSuccess();
          setIsPro(true);
          toast.success(t('pro.purchaseSuccess'));
          setShowProModal(false);
        } else {
          hapticError();
          toast.error(t('pro.purchaseFailed'));
        }
      } else {
        // Web: no purchase available
        toast.error(t('pro.purchaseNativeOnly'));
      }
    } catch {
      hapticError();
      toast.error(t('pro.purchaseFailed'));
    }
    setIsLoading(false);
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const success = await restorePurchases();
      if (success) {
        hapticSuccess();
        setIsPro(true);
        toast.success(t('pro.restoreSuccess'));
        setShowProModal(false);
      } else {
        toast.error(t('pro.restoreNotFound'));
      }
    } catch {
      toast.error(t('pro.restoreFailed'));
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {showProModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProModal(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
          />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={cn(
              'fixed z-[60]',
              'bg-card shadow-lg',
              'max-h-[85vh] overflow-hidden',
              'bottom-0 left-0 right-0 rounded-t-3xl safe-bottom',
              'md:inset-0 md:m-auto md:rounded-2xl md:max-w-xl md:w-[calc(100%-2rem)] md:h-fit'
            )}
          >
            <div className="flex justify-center py-3 md:hidden">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <button
              onClick={() => setShowProModal(false)}
              className="absolute top-4 right-5 w-12 h-12 rounded-xl bg-muted flex items-center justify-center tap-target z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="px-6 pb-8 overflow-y-auto max-h-[calc(90vh-60px)]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {t('pro.unlock', { feature: proModalFeature || 'Pro' })}
                </h2>
                <p className="text-muted-foreground">
                  {t('pro.choosePlan')}
                </p>
              </div>

              {/* Plan Selection */}
              <div className="space-y-3 mb-6">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.type;
                  const isPopular = plan.type === 'yearly';
                  const isLifetime = plan.type === 'lifetime';

                  return (
                    <button
                      key={plan.type}
                      onClick={() => setSelectedPlan(plan.type)}
                      className={cn(
                        'w-full p-4 rounded-2xl border-2 transition-all text-left relative',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      {isPopular && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase">
                          {t('pro.popular')}
                        </span>
                      )}
                      {isLifetime && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full uppercase">
                          {t('pro.bestValue')}
                        </span>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-base">
                            {plan.type === 'monthly' && t('pro.monthlyPlan')}
                            {plan.type === 'yearly' && t('pro.yearlyPlan')}
                            {plan.type === 'lifetime' && t('pro.lifetimePlan')}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {plan.type === 'monthly' && t('pro.cancel')}
                            {plan.type === 'yearly' && plan.savePercent && t('pro.savePercent', { percent: String(plan.savePercent) })}
                            {plan.type === 'lifetime' && t('pro.oneTimePayment')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold">{plan.priceString}</span>
                          <span className="text-xs text-muted-foreground block">
                            {plan.type === 'monthly' && t('pro.monthly')}
                            {plan.type === 'yearly' && t('pro.yearly')}
                            {plan.type === 'lifetime' && t('pro.lifetime')}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Purchase Button */}
              {productsLoading ? (
                <Button
                  className="w-full tap-target h-12 text-base font-semibold"
                  disabled
                >
                  {t('pro.loadingProducts')}
                </Button>
              ) : (
                <Button
                  className="w-full tap-target h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  onClick={handlePurchase}
                  disabled={isLoading}
                >
                  {isLoading ? t('pro.processing') : (
                    selectedPlan === 'lifetime' ? t('pro.purchaseLifetime') :
                    selectedPlan === 'yearly' ? t('pro.yearlyPlan') + ' — ' + plans.find(p => p.type === 'yearly')?.priceString :
                    t('pro.monthlyPlan') + ' — ' + plans.find(p => p.type === 'monthly')?.priceString
                  )}
                </Button>
              )}

              {!canPurchase && isNative && !productsLoading && (
                <button
                  onClick={retryLoadProducts}
                  className="w-full text-center text-xs text-muted-foreground mt-1 py-1"
                >
                  {t('pro.tapToRetry')}
                </button>
              )}

              {/* Restore Purchases */}
              <button
                onClick={handleRestore}
                disabled={isLoading}
                className="w-full text-center text-sm text-muted-foreground mt-3 py-2"
              >
                {t('pro.restorePurchases')}
              </button>

              {/* Features */}
              <div className="mt-4 mb-4">
                <p className="text-sm font-medium mb-3">{t('pro.featuresIncluded')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {proFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const isHighlighted = proModalFeature &&
                      t(feature.titleKey).toLowerCase().includes(proModalFeature.toLowerCase());

                    return (
                      <div
                        key={feature.titleKey}
                        className={cn(
                          'p-2.5 rounded-lg border transition-colors',
                          isHighlighted
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card'
                        )}
                      >
                        <Icon className={cn(
                          'w-4 h-4 mb-1.5',
                          isHighlighted ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <h4 className="font-medium text-xs leading-tight line-clamp-1">{t(feature.titleKey)}</h4>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{t(feature.descKey)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={t('pro.promoCodePlaceholder')}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const success = activateProWithCode(promoCode);
                    if (success) {
                      setIsPro(true);
                      toast.success(t('pro.promoSuccess'));
                      setShowProModal(false);
                      setPromoCode('');
                    } else {
                      toast.error(t('pro.invalidCode'));
                    }
                  }}
                >
                  {t('pro.applyCode')}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                <a href="https://owebsite.wordpress.com/notivation-privacy-policy-terms-and-services/" target="_blank" rel="noopener noreferrer" className="underline">
                  {t('pro.termsNotice')}
                </a>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
