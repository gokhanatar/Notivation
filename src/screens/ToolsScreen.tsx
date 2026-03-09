import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { useUIStore } from '@/store/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  AlertCircle,
  FolderOpen,
  BookOpen,
  Layout,
  Calendar,
  Network,
  Timer,
  FileBarChart,
  Archive,
  Lock,
} from 'lucide-react';

interface ToolsScreenProps {
  onOpenWeeklyDigest: () => void;
  onOpenFocusMode: () => void;
  onOpenNoteGraph: () => void;
  onOpenCalendarView: () => void;
  onOpenOpenLoops: () => void;
  onOpenFolders: () => void;
  onOpenMyWords: () => void;
  onOpenCanvas: () => void;
  onOpenArchive: () => void;
}

const toolItems = [
  { id: 'openLoops', icon: AlertCircle, labelKey: 'loops.title', color: 'text-red-500', bg: 'bg-red-500/10', pro: true },
  { id: 'folders', icon: FolderOpen, labelKey: 'folders.title', color: 'text-amber-500', bg: 'bg-amber-500/10', pro: true },
  { id: 'myWords', icon: BookOpen, labelKey: 'myWords.title', color: 'text-purple-500', bg: 'bg-purple-500/10', pro: true },
  { id: 'canvas', icon: Layout, labelKey: 'canvas.title', color: 'text-blue-500', bg: 'bg-blue-500/10', pro: true },
  { id: 'calendarView', icon: Calendar, labelKey: 'pro.calendarView', color: 'text-emerald-500', bg: 'bg-emerald-500/10', pro: true },
  { id: 'noteGraph', icon: Network, labelKey: 'pro.noteGraph', color: 'text-indigo-500', bg: 'bg-indigo-500/10', pro: true },
  { id: 'focusMode', icon: Timer, labelKey: 'pro.focusMode', color: 'text-orange-500', bg: 'bg-orange-500/10', pro: true },
  { id: 'weeklyDigest', icon: FileBarChart, labelKey: 'digest.title', color: 'text-teal-500', bg: 'bg-teal-500/10', pro: true },
  { id: 'archive', icon: Archive, labelKey: 'archive.title', color: 'text-gray-500', bg: 'bg-gray-500/10', pro: false },
];

export function ToolsScreen({
  onOpenWeeklyDigest,
  onOpenFocusMode,
  onOpenNoteGraph,
  onOpenCalendarView,
  onOpenOpenLoops,
  onOpenFolders,
  onOpenMyWords,
  onOpenCanvas,
  onOpenArchive,
}: ToolsScreenProps) {
  const { t } = useTranslation();
  const { isPro, setShowProModal, setProModalFeature } = useUIStore();

  const handleClick = (id: string, requiresPro: boolean) => {
    if (requiresPro && !isPro) {
      setProModalFeature(id);
      setShowProModal(true);
      return;
    }
    switch (id) {
      case 'openLoops': onOpenOpenLoops(); break;
      case 'folders': onOpenFolders(); break;
      case 'myWords': onOpenMyWords(); break;
      case 'canvas': onOpenCanvas(); break;
      case 'calendarView': onOpenCalendarView(); break;
      case 'noteGraph': onOpenNoteGraph(); break;
      case 'focusMode': onOpenFocusMode(); break;
      case 'weeklyDigest': onOpenWeeklyDigest(); break;
      case 'archive': onOpenArchive(); break;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('nav.tools')}
        subtitle={t('tools.subtitle')}
      />

      <div className="flex-1 overflow-y-auto -mx-4 px-4 md:-mx-0 md:px-0 pb-20 md:pb-6 scrollbar-hide">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {toolItems.map((tool, idx) => {
            const Icon = tool.icon;
            const needsPro = tool.pro && !isPro;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleClick(tool.id, tool.pro)}
                className="relative flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 active:scale-[0.98] transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {t(tool.labelKey) || tool.id}
                  </p>
                </div>
                {needsPro && (
                  <Lock className="absolute top-3 right-3 w-3.5 h-3.5 text-muted-foreground" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
