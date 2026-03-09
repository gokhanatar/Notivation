import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInitializeApp, useNotes, useActionItems, useThemeManager } from '@/hooks/useNotes';
import { useNotificationListener } from '@/hooks/useNotifications';
import { useAppLock } from '@/hooks/useBiometrics';
import { useUIStore } from '@/store/useStore';
import { AppLockScreen } from '@/components/native/AppLockScreen';
import { BottomNav } from '@/components/layout/BottomNav';
import { StreamScreen } from '@/screens/StreamScreen';
import { NoteDetailScreen } from '@/screens/NoteDetailScreen';
import { ActionsScreen } from '@/screens/ActionsScreen';
import { DecideScreen } from '@/screens/DecideScreen';
import { ProModal } from '@/components/modals/ProModal';
import { UndoToast } from '@/components/modals/UndoToast';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDeepLinks } from '@/hooks/useDeepLinks';
import { useShareReceiver } from '@/hooks/useShareReceiver';
import { ShareReceiverModal } from '@/components/modals/ShareReceiverModal';
import { useNoteActions } from '@/hooks/useNotes';
import { ArchiveScreen } from '@/screens/ArchiveScreen';
import { WeeklyDigestScreen } from '@/screens/WeeklyDigestScreen';
import { FocusMode } from '@/components/modals/FocusMode';
import { NoteGraphModal } from '@/components/modals/NoteGraphModal';
import { CalendarViewScreen } from '@/screens/CalendarViewScreen';
import { OpenLoopsScreen } from '@/screens/OpenLoopsScreen';
import { FoldersScreen } from '@/screens/FoldersScreen';
import { MyWordsModal } from '@/components/modals/MyWordsModal';
import { CanvasView } from '@/components/canvas/CanvasView';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { ToolsScreen } from '@/screens/ToolsScreen';

const Index = () => {
  const [isOnboarded, setIsOnboarded] = useState(
    () => localStorage.getItem('notivation-onboarded') === 'true'
  );
  const isLoading = useInitializeApp();
  useThemeManager();

  const { createNote } = useNoteActions();
  const { sharedContent, clearSharedContent } = useShareReceiver();

  const activeTab = useUIStore((s) => s.activeTab);
  const showSettingsDrawer = useUIStore((s) => s.showSettingsDrawer);
  const setShowSettingsDrawer = useUIStore((s) => s.setShowSettingsDrawer);
  const showSearchOverlay = useUIStore((s) => s.showSearchOverlay);
  const setShowSearchOverlay = useUIStore((s) => s.setShowSearchOverlay);
  const storeSelectedNoteId = useUIStore((s) => s.selectedNoteId);
  const [selectedNoteId, setSelectedNoteIdLocal] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showWeeklyDigest, setShowWeeklyDigest] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showNoteGraph, setShowNoteGraph] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showOpenLoops, setShowOpenLoops] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [showMyWords, setShowMyWords] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  // Sync store → local (for wikilink navigation from NoteDetailScreen)
  useEffect(() => {
    if (storeSelectedNoteId && storeSelectedNoteId !== selectedNoteId) {
      setSelectedNoteIdLocal(storeSelectedNoteId);
    }
  }, [storeSelectedNoteId]);

  const setSelectedNoteId = useCallback((id: string | null) => {
    setSelectedNoteIdLocal(id);
    useUIStore.getState().setSelectedNoteId(id);
  }, []);

  // Handle notification tap → open note
  const handleNotificationNoteSelect = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
  }, []);
  useNotificationListener(handleNotificationNoteSelect);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewNote: () => {
      useUIStore.getState().setActiveTab('stream');
    },
    onSearch: () => {
      useUIStore.getState().setShowSearchOverlay(true);
    },
  });

  // Deep links
  useDeepLinks({
    onNewNote: () => useUIStore.getState().setActiveTab('stream'),
    onSearch: () => useUIStore.getState().setShowSearchOverlay(true),
    onNoteSelect: handleNotificationNoteSelect,
  });

  // Hardware back button handler (Capacitor + browser)
  useEffect(() => {
    const handleBackButton = () => {
      // Close overlays/drawers first, then navigate back
      if (showSearchOverlay) {
        setShowSearchOverlay(false);
        return;
      }
      if (showSettingsDrawer) {
        setShowSettingsDrawer(false);
        return;
      }
      if (selectedNoteId) {
        setSelectedNoteId(null);
        return;
      }
      if (showArchive) {
        setShowArchive(false);
        return;
      }
      if (showWeeklyDigest) {
        setShowWeeklyDigest(false);
        return;
      }
      if (showCalendarView) {
        setShowCalendarView(false);
        return;
      }
      if (showFocusMode) {
        setShowFocusMode(false);
        return;
      }
      if (showNoteGraph) {
        setShowNoteGraph(false);
        return;
      }
      if (showOpenLoops) {
        setShowOpenLoops(false);
        return;
      }
      if (showFolders) {
        setShowFolders(false);
        return;
      }
      if (showCanvas) {
        setShowCanvas(false);
        return;
      }
    };

    // Browser popstate (swipe-back on iOS Safari / Android Chrome)
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleBackButton();
      // Push a dummy state to keep history working
      window.history.pushState(null, '', window.location.href);
    };

    // Push initial state for popstate to work
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showSearchOverlay, showSettingsDrawer, selectedNoteId, showArchive, showWeeklyDigest, showCalendarView, showFocusMode, showNoteGraph, showOpenLoops, showFolders, showCanvas]);

  // App lock
  const { isLocked, unlock } = useAppLock();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden"><img src="/logo.png" alt="Notivation" className="w-full h-full object-cover" /></div>
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  const renderScreen = () => {
    if (showArchive) {
      return <ArchiveScreen onBack={() => setShowArchive(false)} onNoteSelect={setSelectedNoteId} />;
    }
    if (showWeeklyDigest) {
      return <WeeklyDigestScreen onBack={() => setShowWeeklyDigest(false)} />;
    }
    if (showCalendarView) {
      return <CalendarViewScreen onClose={() => setShowCalendarView(false)} onNoteSelect={(id) => { setShowCalendarView(false); setSelectedNoteId(id); }} />;
    }
    if (showOpenLoops) {
      return <OpenLoopsScreen onBack={() => setShowOpenLoops(false)} onNoteSelect={(id) => { setShowOpenLoops(false); setSelectedNoteId(id); }} />;
    }
    if (showFolders) {
      return <FoldersScreen onBack={() => setShowFolders(false)} onNoteSelect={(id) => { setShowFolders(false); setSelectedNoteId(id); }} />;
    }

    if (selectedNoteId) {
      return (
        <NoteDetailScreen
          noteId={selectedNoteId}
          onBack={() => setSelectedNoteId(null)}
        />
      );
    }

    switch (activeTab) {
      case 'stream':
        return <StreamScreen onNoteSelect={setSelectedNoteId} />;
      case 'actions':
        return <ActionsScreen onNoteSelect={setSelectedNoteId} />;
      case 'decide':
        return <DecideScreen onNoteSelect={setSelectedNoteId} />;
      case 'tools':
        return (
          <ToolsScreen
            onOpenWeeklyDigest={() => setShowWeeklyDigest(true)}
            onOpenFocusMode={() => setShowFocusMode(true)}
            onOpenNoteGraph={() => setShowNoteGraph(true)}
            onOpenCalendarView={() => setShowCalendarView(true)}
            onOpenOpenLoops={() => setShowOpenLoops(true)}
            onOpenFolders={() => setShowFolders(true)}
            onOpenMyWords={() => setShowMyWords(true)}
            onOpenCanvas={() => setShowCanvas(true)}
            onOpenArchive={() => setShowArchive(true)}
          />
        );
      default:
        return <StreamScreen onNoteSelect={setSelectedNoteId} />;
    }
  };

  if (!isOnboarded) {
    return <OnboardingFlow onComplete={() => setIsOnboarded(true)} />;
  }

  if (isLocked) {
    return <AppLockScreen onUnlock={unlock} />;
  }

  return (
    <div className={cn(
      'min-h-screen bg-background',
      'flex flex-col md:flex-row'
    )}>
      <BottomNav hidePhoneNav={!!selectedNoteId || showArchive || showWeeklyDigest || showCalendarView || showOpenLoops || showFolders} />
      <main className="flex-1 px-4 md:px-6 lg:px-8 pt-6 pb-20 md:pb-6 max-w-lg md:max-w-4xl mx-auto w-full safe-top">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNoteId || (showArchive ? 'archive' : showWeeklyDigest ? 'digest' : showOpenLoops ? 'openloops' : showFolders ? 'folders' : activeTab)}
            initial={{ opacity: 0, x: selectedNoteId ? 20 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: selectedNoteId ? -20 : 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
      <ProModal />
      <UndoToast />
      <SettingsDrawer
        open={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        onOpenWeeklyDigest={() => setShowWeeklyDigest(true)}
        onOpenFocusMode={() => setShowFocusMode(true)}
        onOpenNoteGraph={() => setShowNoteGraph(true)}
        onOpenCalendarView={() => setShowCalendarView(true)}
        onOpenOpenLoops={() => setShowOpenLoops(true)}
        onOpenFolders={() => setShowFolders(true)}
        onOpenMyWords={() => setShowMyWords(true)}
        onOpenCanvas={() => setShowCanvas(true)}
      />
      <SearchOverlay
        open={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        onNoteSelect={setSelectedNoteId}
      />
      <FocusMode open={showFocusMode} onClose={() => setShowFocusMode(false)} />
      <NoteGraphModal
        open={showNoteGraph}
        onClose={() => setShowNoteGraph(false)}
        onNoteSelect={(id) => { setShowNoteGraph(false); setSelectedNoteId(id); }}
      />
      <ShareReceiverModal
        content={sharedContent}
        open={!!sharedContent}
        onOpenChange={(open) => !open && clearSharedContent()}
        onCreateNote={async (data) => {
          const note = await createNote(data);
          setSelectedNoteId(note.id);
          clearSharedContent();
        }}
      />
      <MyWordsModal open={showMyWords} onOpenChange={setShowMyWords} />
      <CanvasView
        open={showCanvas}
        onClose={() => setShowCanvas(false)}
        onNoteSelect={(id) => { setShowCanvas(false); setSelectedNoteId(id); }}
      />
    </div>
  );
};

export default Index;
