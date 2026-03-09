import { useState, useEffect, useCallback } from 'react';
import {
  getCanvasLayout,
  saveNotePosition,
  createConnection,
  deleteConnection,
  autoLayout,
  type CanvasLayout,
} from '@/lib/canvas/canvasEngine';
import type { CanvasConnection } from '@/lib/db';

export function useCanvas() {
  const [layout, setLayout] = useState<CanvasLayout | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getCanvasLayout();
    setLayout(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const moveNote = useCallback(async (noteId: string, x: number, y: number) => {
    await saveNotePosition(noteId, x, y);
    setLayout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        notes: prev.notes.map(n => n.id === noteId ? { ...n, x, y } : n),
      };
    });
  }, []);

  const addConnection = useCallback(async (fromId: string, toId: string, label?: string) => {
    const conn = await createConnection(fromId, toId, label);
    setLayout(prev => {
      if (!prev) return prev;
      return { ...prev, connections: [...prev.connections, conn] };
    });
    return conn;
  }, []);

  const removeConnection = useCallback(async (id: string) => {
    await deleteConnection(id);
    setLayout(prev => {
      if (!prev) return prev;
      return { ...prev, connections: prev.connections.filter(c => c.id !== id) };
    });
  }, []);

  const runAutoLayout = useCallback(async () => {
    if (!layout) return;
    const newPositions = autoLayout(
      layout.notes.map(n => ({ id: n.id, x: n.x, y: n.y })),
      layout.connections
    );
    // Save all positions
    for (const pos of newPositions) {
      await saveNotePosition(pos.id, pos.x, pos.y);
    }
    setLayout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        notes: prev.notes.map(n => {
          const pos = newPositions.find(p => p.id === n.id);
          return pos ? { ...n, x: pos.x, y: pos.y } : n;
        }),
      };
    });
  }, [layout]);

  return { layout, loading, refresh, moveNote, addConnection, removeConnection, runAutoLayout };
}
