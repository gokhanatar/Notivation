import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network } from 'lucide-react';
import { useCanvas } from '@/hooks/useCanvas';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { CanvasNoteCard } from './CanvasNoteCard';
import { ConnectionLine } from './ConnectionLine';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasConnectionDialog } from './CanvasConnectionDialog';

interface CanvasViewProps {
  open: boolean;
  onClose: () => void;
  onNoteSelect: (noteId: string) => void;
}

const CARD_WIDTH = 180;
const CARD_HEIGHT = 80;

export function CanvasView({ open, onClose, onNoteSelect }: CanvasViewProps) {
  const { t } = useTranslation();
  const { layout, loading, moveNote, addConnection, removeConnection, runAutoLayout } = useCanvas();

  // Viewport state
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [connectionStartId, setConnectionStartId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ startX: number; startY: number; vpX: number; vpY: number } | null>(null);

  // Reset viewport when opened
  useEffect(() => {
    if (open) {
      setViewport({ x: 0, y: 0, scale: 1 });
      setSelectedNoteId(null);
      setConnectionMode(false);
      setConnectionStartId(null);
    }
  }, [open]);

  // Pan handlers on empty space
  const handleBackgroundPointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan if clicking on the background itself
    if ((e.target as HTMLElement) !== containerRef.current) return;
    e.preventDefault();

    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      vpX: viewport.x,
      vpY: viewport.y,
    };
    setIsDragging(true);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [viewport.x, viewport.y]);

  const handleBackgroundPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current || !isDragging) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setViewport(prev => ({
      ...prev,
      x: panRef.current!.vpX + dx,
      y: panRef.current!.vpY + dy,
    }));
  }, [isDragging]);

  const handleBackgroundPointerUp = useCallback(() => {
    panRef.current = null;
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setViewport(prev => ({
      ...prev,
      scale: Math.min(2.0, Math.max(0.3, prev.scale + delta)),
    }));
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setViewport(prev => ({ ...prev, scale: Math.min(2.0, prev.scale + 0.15) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewport(prev => ({ ...prev, scale: Math.max(0.3, prev.scale - 0.15) }));
  }, []);

  const handleReset = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 1 });
  }, []);

  // Note drag handlers
  const handleNoteDragStart = useCallback((noteId: string) => {
    setDraggedNoteId(noteId);
  }, []);

  const handleNoteDragEnd = useCallback((noteId: string, x: number, y: number) => {
    // Adjust for viewport scale
    moveNote(noteId, x, y);
    setDraggedNoteId(null);
  }, [moveNote]);

  // Note interactions
  const handleNoteDoubleClick = useCallback((noteId: string) => {
    onNoteSelect(noteId);
  }, [onNoteSelect]);

  const handleNoteLongPress = useCallback((noteId: string) => {
    if (connectionMode) {
      if (!connectionStartId) {
        setConnectionStartId(noteId);
        setSelectedNoteId(noteId);
      } else if (connectionStartId !== noteId) {
        addConnection(connectionStartId, noteId);
        setConnectionStartId(null);
        setSelectedNoteId(null);
      }
    } else {
      setSelectedNoteId(prev => prev === noteId ? null : noteId);
    }
  }, [connectionMode, connectionStartId, addConnection]);

  const handleToggleConnectionMode = useCallback(() => {
    setConnectionMode(prev => !prev);
    setConnectionStartId(null);
    setSelectedNoteId(null);
  }, []);

  // Calculate connection coordinates (center of note cards)
  const getNoteCenter = useCallback((noteId: string) => {
    if (!layout) return { x: 0, y: 0 };
    const note = layout.notes.find(n => n.id === noteId);
    if (!note) return { x: 0, y: 0 };
    return {
      x: note.x + CARD_WIDTH / 2,
      y: note.y + CARD_HEIGHT / 2,
    };
  }, [layout]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm border-b border-border z-[60]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Network className="w-5 h-5" />
              {t('canvas.title')}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Canvas area */}
          <div
            ref={containerRef}
            className="absolute inset-0 top-14 overflow-hidden"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={handleBackgroundPointerDown}
            onPointerMove={handleBackgroundPointerMove}
            onPointerUp={handleBackgroundPointerUp}
            onWheel={handleWheel}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : !layout || layout.notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Network className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-1">{t('canvas.empty')}</h3>
                <p className="text-sm text-muted-foreground/70">{t('canvas.emptyDesc')}</p>
              </div>
            ) : (
              <div
                style={{
                  transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                  transformOrigin: '0 0',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                {/* SVG layer for connections */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ overflow: 'visible', zIndex: 0 }}
                >
                  <g style={{ pointerEvents: 'auto' }}>
                    {layout.connections.map(conn => {
                      const from = getNoteCenter(conn.fromNoteId);
                      const to = getNoteCenter(conn.toNoteId);
                      return (
                        <ConnectionLine
                          key={conn.id}
                          fromX={from.x}
                          fromY={from.y}
                          toX={to.x}
                          toY={to.y}
                          label={conn.label}
                          color={conn.color}
                          onDelete={() => removeConnection(conn.id)}
                        />
                      );
                    })}
                  </g>
                </svg>

                {/* Note cards layer */}
                {layout.notes.map(note => (
                  <CanvasNoteCard
                    key={note.id}
                    note={note}
                    onDragStart={() => handleNoteDragStart(note.id)}
                    onDragEnd={(x, y) => handleNoteDragEnd(note.id, x, y)}
                    onDoubleClick={() => handleNoteDoubleClick(note.id)}
                    onLongPress={() => handleNoteLongPress(note.id)}
                    isSelected={selectedNoteId === note.id || connectionStartId === note.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Connection mode hint */}
          {connectionMode && connectionStartId && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-full shadow-md z-[60]">
              {t('canvas.selectTarget')}
            </div>
          )}

          {/* Toolbar */}
          {layout && layout.notes.length > 0 && (
            <CanvasToolbar
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
              onAutoLayout={runAutoLayout}
              onToggleConnectionMode={handleToggleConnectionMode}
              connectionMode={connectionMode}
              scale={viewport.scale}
            />
          )}

          {/* Connection dialog */}
          {layout && (
            <CanvasConnectionDialog
              open={connectionDialogOpen}
              onOpenChange={setConnectionDialogOpen}
              notes={layout.notes}
              onConnect={(fromId, toId, label) => addConnection(fromId, toId, label)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
