import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useStore';
import { ProLockedState } from '@/components/notes/ProLockedState';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguageStore, useTranslation } from '@/lib/i18n';
import { languages } from '@/lib/i18n/languages';
import { deactivateProLocally, restorePurchases, getActivePlan } from '@/lib/native/purchases';
import { getSettings, updateSettings, db } from '@/lib/db';
import { checkBiometricAvailability } from '@/lib/native/biometrics';
import { hapticLight, hapticHeavy } from '@/lib/native/haptics';
import {
  Palette,
  Shield,
  Database,
  Sparkles,
  Info,
  Sun,
  Moon,
  Leaf,
  Baby,
  Eye,
  Minimize2,
  Waves,
  TreePine,
  Sunset,
  Lock,
  Download,
  FileText,
  Trash2,
  Globe,
  X,
  Type,
  Timer,
  Network,
  Calendar,
  Heart,
  FileDown,
  Gauge,
  AlertCircle,
  FolderOpen,
  BookOpen,
  Layout,
  Cake,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { BackupModal } from '@/components/modals/BackupModal';
import { TrustLevelBadge } from '@/components/trust/TrustLevelBadge';
import { downloadMarkdownExport } from '@/lib/backup/markdownExport';
import { AI_MODELS, API_KEY_URLS, type AIProviderType } from '@/lib/ai/aiService';
import { useAI } from '@/hooks/useAI';
import { Bot, ExternalLink, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AIConsentDialog } from '@/components/modals/AIConsentDialog';

const fontOptions = [
  { id: 'Inter', label: 'Inter (Default)' },
  { id: 'Georgia', label: 'Georgia (Serif)' },
  { id: 'ui-monospace', label: 'Monospace' },
  { id: 'system-ui', label: 'System UI' },
];

const themes = [
  { id: 'light' as const, labelKey: 'settings.themeLight', icon: Sun, pro: false },
  { id: 'dark' as const, labelKey: 'settings.themeDark', icon: Moon, pro: false },
  { id: 'warm' as const, labelKey: 'settings.themeWarm', icon: Leaf, pro: true },
  { id: 'kids' as const, labelKey: 'settings.themeKids', icon: Baby, pro: true },
  { id: 'senior' as const, labelKey: 'settings.themeSenior', icon: Eye, pro: true },
  { id: 'minimal' as const, labelKey: 'settings.themeMinimal', icon: Minimize2, pro: true },
  { id: 'oled' as const, labelKey: 'settings.themeOled', icon: Moon, pro: true },
  { id: 'ocean' as const, labelKey: 'settings.themeOcean', icon: Waves, pro: true },
  { id: 'forest' as const, labelKey: 'settings.themeForest', icon: TreePine, pro: true },
  { id: 'sunset' as const, labelKey: 'settings.themeSunset', icon: Sunset, pro: true },
];

interface SettingsScreenProps {
  onOpenWeeklyDigest?: () => void;
  onOpenFocusMode?: () => void;
  onOpenNoteGraph?: () => void;
  onOpenCalendarView?: () => void;
  onOpenOpenLoops?: () => void;
  onOpenFolders?: () => void;
  onOpenMyWords?: () => void;
  onOpenCanvas?: () => void;
}

export function SettingsScreen({ onOpenWeeklyDigest, onOpenFocusMode, onOpenNoteGraph, onOpenCalendarView, onOpenOpenLoops, onOpenFolders, onOpenMyWords, onOpenCanvas }: SettingsScreenProps = {}) {
  const { theme, setTheme, isPro, setIsPro, setShowProModal, setProModalFeature } = useUIStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  // Backup modal state
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Font state
  const [fontFamily, setFontFamily] = useState('Inter');

  // Security settings state
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState(5);
  const [biometricAvailable, setBiometricAvailable] = useState(true);

  // Write Speed & Trust
  const [writeSpeedEnabled, setWriteSpeedEnabled] = useState(true);
  const [trustOverride, setTrustOverride] = useState(false);

  // New feature toggles
  const [freshStartEnabled, setFreshStartEnabled] = useState(true);
  const [momentumEnabled, setMomentumEnabled] = useState(true);
  const [userBirthday, setUserBirthday] = useState('');

  // AI settings
  const [aiProvider, setAiProvider] = useState<AIProviderType>('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<'success' | 'failed' | null>(null);
  const [aiConsentGiven, setAiConsentGiven] = useState(false);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const { testConnection, loading: aiTesting } = useAI();

  useEffect(() => {
    async function loadSecuritySettings() {
      const settings = await getSettings();
      setAppLockEnabled(settings.appLockEnabled);
      setAutoLockTimeout(settings.autoLockTimeout);
      if (settings.fontFamily) setFontFamily(settings.fontFamily);
      if (settings.writeSpeedIndicatorEnabled !== undefined) setWriteSpeedEnabled(settings.writeSpeedIndicatorEnabled);
      if (settings.trustOverride) setTrustOverride(settings.trustOverride);
      if (settings.freshStartEnabled !== undefined) setFreshStartEnabled(settings.freshStartEnabled !== false);
      if (settings.momentumEnabled !== undefined) setMomentumEnabled(settings.momentumEnabled !== false);
      if (settings.userBirthday) setUserBirthday(settings.userBirthday);

      // AI settings
      if (settings.aiProvider) setAiProvider(settings.aiProvider);
      if (settings.aiModel) setAiModel(settings.aiModel);
      if (settings.aiApiKey) setAiApiKey(settings.aiApiKey);
      if (settings.aiEnabled !== undefined) setAiEnabled(settings.aiEnabled);
      if (settings.aiConsentGiven) setAiConsentGiven(settings.aiConsentGiven);

      const bio = await checkBiometricAvailability();
      setBiometricAvailable(bio.available);
    }
    loadSecuritySettings();
  }, []);

  const handleAppLockToggle = async (checked: boolean) => {
    setAppLockEnabled(checked);
    await updateSettings({ appLockEnabled: checked });
  };

  const handleAutoLockTimeoutChange = async () => {
    // Cycle through timeout options: 1, 5, 15, 30
    const options = [1, 5, 15, 30];
    const currentIndex = options.indexOf(autoLockTimeout);
    const nextIndex = (currentIndex + 1) % options.length;
    const newTimeout = options[nextIndex];
    setAutoLockTimeout(newTimeout);
    await updateSettings({ autoLockTimeout: newTimeout });
  };

  const handleProFeatureClick = (feature: string) => {
    if (!isPro) {
      setProModalFeature(feature);
      setShowProModal(true);
    }
  };

  const handleFontChange = async (font: string) => {
    setFontFamily(font);
    document.documentElement.style.setProperty('--font-family', font);
    await updateSettings({ fontFamily: font });
  };

  const handleDeactivatePro = () => {
    deactivateProLocally();
    setIsPro(false);
    toast.success(t('settings.proDeactivated'));
  };

  const handleClearData = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      hapticHeavy();
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    try {
      await db.notes.clear();
      await db.actionItems.clear();
      await db.tags.clear();
      await db.noteTags.clear();
      if (db.table('decisionItems')) {
        await db.table('decisionItems').clear();
      }
      hapticHeavy();
      toast.success(t('settings.dataCleared'));
      setConfirmClear(false);
      window.location.reload();
    } catch {
      toast.error('Failed to clear data');
    }
  };

  const handleRestorePurchases = async () => {
    const success = await restorePurchases();
    if (success) {
      setIsPro(true);
      toast.success(t('pro.restoreSuccess'));
    } else {
      toast.error(t('pro.restoreNotFound'));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-8 space-y-6 md:space-y-8 scrollbar-hide max-w-2xl md:mx-auto md:w-full">
        {/* Language */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('settings.language')}</h3>
          </div>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue>
                {languages.find(l => l.code === language)?.nativeName || 'English'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <ScrollArea className="h-64">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.nativeName}</span>
                      <span className="text-muted-foreground text-xs">({lang.name})</span>
                    </span>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </section>

        {/* Appearance */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Palette className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('settings.appearance')}</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.id;

              return (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    if (themeOption.pro && !isPro) {
                      setProModalFeature(t(themeOption.labelKey));
                      setShowProModal(true);
                      return;
                    }
                    hapticLight();
                    setTheme(themeOption.id);
                  }}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-xl',
                    'border-2 transition-all tap-target press-effect',
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn(
                      'w-5 h-5',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    {themeOption.pro && !isPro && (
                      <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-muted-foreground" />
                    )}
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {t(themeOption.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Security (Pro) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('settings.security')}</h3>
            {!isPro && <Lock className="w-3.5 h-3.5" />}
          </div>

          {isPro ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div>
                  <p className="font-medium text-sm">{t('settings.appLock')}</p>
                  <p className="text-xs text-muted-foreground">
                    {biometricAvailable
                      ? t('settings.appLockDesc')
                      : t('settings.appLockDesc') + ' (Biometrics not available)'}
                  </p>
                </div>
                <Switch
                  checked={appLockEnabled}
                  onCheckedChange={handleAppLockToggle}
                  disabled={!biometricAvailable}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div>
                  <p className="font-medium text-sm">{t('settings.autoLock')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.autoLockDesc')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoLockTimeoutChange}
                  disabled={!appLockEnabled}
                >
                  {autoLockTimeout} min
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div>
                  <p className="font-medium text-sm">{t('settings.vault')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.vaultDesc')}</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </div>
          ) : (
            <ProLockedState
              feature={t('settings.security')}
              description={t('settings.securityLockedDesc')}
            />
          )}
        </section>

        {/* Pro Tools */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('settings.proTools')}</h3>
            {!isPro && <Lock className="w-3.5 h-3.5" />}
          </div>

          <div className="space-y-2">
            {/* Custom Fonts */}
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">{t('pro.customFonts')}</p>
                {!isPro && <Lock className="w-3 h-3 opacity-50 ml-auto" />}
              </div>
              {isPro ? (
                <div className="flex gap-2 flex-wrap">
                  {fontOptions.map(f => (
                    <button
                      key={f.id}
                      onClick={() => handleFontChange(f.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                        fontFamily === f.id ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/40'
                      )}
                      style={{ fontFamily: f.id }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              ) : (
                <button onClick={() => handleProFeatureClick('Custom Fonts')} className="text-xs text-muted-foreground">
                  {t('pro.customFontsDesc')}
                </button>
              )}
            </div>

            {/* Focus Mode */}
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) { handleProFeatureClick('Focus Mode'); return; }
                onOpenFocusMode?.();
              }}
            >
              <Timer className="w-4 h-4 mr-2" />
              {t('pro.focusMode')}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>

            {/* Note Graph */}
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) { handleProFeatureClick('Note Graph'); return; }
                onOpenNoteGraph?.();
              }}
            >
              <Network className="w-4 h-4 mr-2" />
              {t('pro.noteGraph')}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>

            {/* Calendar View */}
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) { handleProFeatureClick('Calendar View'); return; }
                onOpenCalendarView?.();
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('pro.calendarView')}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>

            {/* Open Loops */}
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) { handleProFeatureClick('Open Loops'); return; }
                onOpenOpenLoops?.();
              }}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('loops.title') || 'Open Loops'}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>

            {/* Folders */}
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) { handleProFeatureClick('Folders'); return; }
                onOpenFolders?.();
              }}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {t('folders.title') || 'Folders'}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>

            {/* My Words */}
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) { handleProFeatureClick('My Words'); return; }
                onOpenMyWords?.();
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {t('myWords.title') || 'My Words'}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>

            {/* Canvas */}
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) { handleProFeatureClick('Canvas'); return; }
                onOpenCanvas?.();
              }}
            >
              <Layout className="w-4 h-4 mr-2" />
              {t('canvas.title') || 'Canvas'}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>
          </div>
        </section>

        {/* AI Assistant */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('ai.title')}</h3>
            {!isPro && <Lock className="w-3.5 h-3.5" />}
          </div>

          {isPro ? (
            <div className="space-y-3">
              {/* AI Enabled Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div>
                  <p className="font-medium text-sm">{t('ai.enabled')}</p>
                  <p className="text-xs text-muted-foreground">{t('ai.enabledDesc')}</p>
                </div>
                <Switch
                  checked={aiEnabled}
                  onCheckedChange={async (checked) => {
                    if (checked && !aiConsentGiven) {
                      setShowAiConsent(true);
                      return;
                    }
                    setAiEnabled(checked);
                    await updateSettings({ aiEnabled: checked });
                  }}
                />
              </div>

              {/* AI Data Sharing Banner */}
              {aiEnabled && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <p>{t('ai.dataBanner')}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Google Gemini
                      </a>
                      <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> OpenAI
                      </a>
                      <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Anthropic
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {aiEnabled && (
                <>
                  {/* Provider Selection */}
                  <div className="p-3 rounded-lg bg-card border border-border space-y-2">
                    <p className="font-medium text-sm">{t('ai.provider')}</p>
                    <div className="flex gap-2">
                      {(['gemini', 'openai', 'anthropic'] as AIProviderType[]).map((p) => (
                        <button
                          key={p}
                          onClick={async () => {
                            setAiProvider(p);
                            const defaultModel = AI_MODELS[p][0].id;
                            setAiModel(defaultModel);
                            setAiTestResult(null);
                            await updateSettings({ aiProvider: p, aiModel: defaultModel });
                          }}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors capitalize',
                            aiProvider === p
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/40 text-muted-foreground'
                          )}
                        >
                          {p === 'gemini' ? 'Gemini' : p === 'openai' ? 'OpenAI' : 'Claude'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="p-3 rounded-lg bg-card border border-border space-y-2">
                    <p className="font-medium text-sm">{t('ai.model')}</p>
                    <Select
                      value={aiModel}
                      onValueChange={async (val) => {
                        setAiModel(val);
                        await updateSettings({ aiModel: val });
                      }}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS[aiProvider].map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* API Key */}
                  <div className="p-3 rounded-lg bg-card border border-border space-y-2">
                    <p className="font-medium text-sm">{t('ai.apiKey')}</p>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={aiApiKey}
                        onChange={async (e) => {
                          setAiApiKey(e.target.value);
                          setAiTestResult(null);
                          await updateSettings({ aiApiKey: e.target.value });
                        }}
                        placeholder={t('ai.apiKeyPlaceholder')}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!aiApiKey || aiTesting}
                        onClick={async () => {
                          setAiTestResult(null);
                          const ok = await testConnection(aiProvider, aiModel, aiApiKey);
                          setAiTestResult(ok ? 'success' : 'failed');
                        }}
                      >
                        {aiTesting ? t('ai.testing') : t('ai.test')}
                      </Button>
                    </div>
                    {aiTestResult === 'success' && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {t('ai.testSuccess')}
                      </p>
                    )}
                    {aiTestResult === 'failed' && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {t('ai.testFailed')}
                      </p>
                    )}
                    <a
                      href={API_KEY_URLS[aiProvider]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {t('ai.howToGetKey')}
                    </a>
                  </div>
                </>
              )}
            </div>
          ) : (
            <ProLockedState
              feature={t('ai.title')}
              description={t('ai.enabledDesc')}
            />
          )}
        </section>

        {/* Data */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('settings.data')}</h3>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) {
                  handleProFeatureClick('Export');
                  return;
                }
                setShowBackupModal(true);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              {t('settings.export')}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>

            {/* Markdown Export (D2) */}
            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={async () => {
                try {
                  await downloadMarkdownExport();
                  toast.success(t('backup.markdownExportSuccess'));
                } catch {
                  toast.error(t('backup.exportError'));
                }
              }}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {t('backup.markdownExport')}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start tap-target"
              onClick={() => {
                if (!isPro) {
                  handleProFeatureClick('Weekly Report');
                  return;
                }
                onOpenWeeklyDigest?.();
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('settings.weeklyReport')}
              {!isPro && <Lock className="w-3.5 h-3.5 ml-auto" />}
            </Button>

            <Button
              variant="outline"
              className={cn(
                "w-full justify-start tap-target",
                confirmClear
                  ? "text-white bg-destructive hover:bg-destructive/90 border-destructive"
                  : "text-destructive hover:text-destructive"
              )}
              onClick={handleClearData}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {confirmClear ? t('settings.clearDataConfirm') : t('settings.clearData')}
            </Button>
          </div>
        </section>

        {/* Pro Features */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('settings.pro')}</h3>
          </div>

          {isPro ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">{t('settings.proActive')}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('settings.proActiveDesc')}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• {t('pro.lifetimeAccess')}</p>
                </div>
              </div>

              {import.meta.env.DEV && (
                <Button
                  variant="outline"
                  className="w-full justify-start tap-target text-destructive hover:text-destructive"
                  onClick={handleDeactivatePro}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('settings.deactivatePro')}
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="font-semibold mb-2">{t('settings.unlockPro')}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {t('settings.proDescription')}
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground mb-4">
                <div>✓ {t('pro.moodTracking')}</div>
                <div>✓ {t('pro.streaks')}</div>
                <div>✓ {t('pro.focusMode')}</div>
                <div>✓ {t('pro.voiceMemos')}</div>
                <div>✓ {t('pro.noteGraph')}</div>
                <div>✓ {t('pro.writingStats')}</div>
                <div>✓ {t('pro.templates')}</div>
                <div>✓ {t('pro.analytics')}</div>
                <div>✓ {t('pro.themes')}</div>
                <div>✓ {t('pro.calendarView')}</div>
                <div>✓ {t('pro.readingMode')}</div>
                <div>✓ {t('pro.quickCapture')}</div>
              </div>
              <Button
                className="w-full tap-target bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                onClick={() => setShowProModal(true)}
              >
                {t('settings.unlockPro')}
              </Button>
              <button
                onClick={handleRestorePurchases}
                className="w-full text-center text-sm text-muted-foreground mt-3 py-2"
              >
                {t('pro.restorePurchases')}
              </button>
            </div>
          )}
        </section>

        {/* Cognitive Tools */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('writeSpeed.indicator')}</h3>
          </div>

          <div className="space-y-3">
            {/* Write Speed Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div>
                <p className="font-medium text-sm">{t('writeSpeed.enable')}</p>
                <p className="text-xs text-muted-foreground">{t('writeSpeed.description')}</p>
              </div>
              <Switch
                checked={writeSpeedEnabled}
                onCheckedChange={async (checked) => {
                  setWriteSpeedEnabled(checked);
                  await updateSettings({ writeSpeedIndicatorEnabled: checked });
                }}
              />
            </div>

            {/* Fresh Start Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div>
                <p className="font-medium text-sm">{t('freshStart.enable') || 'Fresh Start Triggers'}</p>
                <p className="text-xs text-muted-foreground">{t('freshStart.enableDesc') || 'Show motivational banners on milestone days'}</p>
              </div>
              <Switch
                checked={freshStartEnabled}
                onCheckedChange={async (checked) => {
                  setFreshStartEnabled(checked);
                  await updateSettings({ freshStartEnabled: checked });
                }}
              />
            </div>

            {/* Birthday Input */}
            {freshStartEnabled && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2">
                  <Cake className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{t('settings.birthday') || 'Birthday'}</p>
                </div>
                <input
                  type="text"
                  placeholder="MM-DD"
                  value={userBirthday}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setUserBirthday(val);
                    if (/^\d{2}-\d{2}$/.test(val)) {
                      await updateSettings({ userBirthday: val });
                    }
                  }}
                  className="w-20 text-right text-sm bg-transparent border-b border-border focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Momentum Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div>
                <p className="font-medium text-sm flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  {t('momentum.enable') || 'Momentum Bar'}
                </p>
                <p className="text-xs text-muted-foreground">{t('momentum.enableDesc') || 'Track your daily productivity momentum'}</p>
              </div>
              <Switch
                checked={momentumEnabled}
                onCheckedChange={async (checked) => {
                  setMomentumEnabled(checked);
                  await updateSettings({ momentumEnabled: checked });
                }}
              />
            </div>

            {/* Trust Level */}
            <TrustLevelBadge />

            {/* Trust Override */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div>
                <p className="font-medium text-sm">{t('trust.override')}</p>
                <p className="text-xs text-muted-foreground">{t('trust.overrideDesc')}</p>
              </div>
              <Switch
                checked={trustOverride}
                onCheckedChange={async (checked) => {
                  setTrustOverride(checked);
                  await updateSettings({ trustOverride: checked });
                }}
              />
            </div>
          </div>
        </section>

        {/* Philosophy (D1) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('oath.title')}</h3>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="font-medium text-sm mb-1">{t('oath.zeropopup')}</p>
              <p className="text-xs text-muted-foreground">{t('oath.zeropopupDesc')}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="font-medium text-sm mb-1">{t('oath.freedom')}</p>
              <p className="text-xs text-muted-foreground">{t('oath.freedomDesc')}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="font-medium text-sm mb-1">{t('oath.friction')}</p>
              <p className="text-xs text-muted-foreground">{t('oath.frictionDesc')}</p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('settings.about')}</h3>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden"><img src="/logo.png" alt="Notivation" className="w-full h-full object-cover" /></div>
            <h4 className="font-bold text-lg mb-1">Notivation</h4>
            <p className="text-sm text-muted-foreground mb-3">{t('settings.version')} 1.0.0</p>
            <p className="text-xs text-muted-foreground mb-4">
              {t('settings.appDescription')}
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <a
                href="https://owebsite.wordpress.com/notivation-privacy-policy-terms-and-services/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                {t('settings.privacyPolicy')}
              </a>
              <span className="text-muted-foreground">|</span>
              <a
                href="https://owebsite.wordpress.com/notivation-privacy-policy-terms-and-services/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                {t('settings.termsOfService')}
              </a>
              <span className="text-muted-foreground">|</span>
              <a
                href="https://owebsite.wordpress.com/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                {t('settings.contact')}
              </a>
            </div>
          </div>
        </section>
      </div>

      <BackupModal open={showBackupModal} onOpenChange={setShowBackupModal} />

      <AIConsentDialog
        open={showAiConsent}
        onAccept={async () => {
          setShowAiConsent(false);
          setAiConsentGiven(true);
          setAiEnabled(true);
          await updateSettings({ aiConsentGiven: true, aiEnabled: true });
        }}
        onDecline={() => {
          setShowAiConsent(false);
        }}
      />
    </div>
  );
}
