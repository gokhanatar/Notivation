import { db, type Note, type CanvasConnection } from '@/lib/db';

export interface CanvasLayout {
  notes: (Note & { x: number; y: number })[];
  connections: CanvasConnection[];
}

export async function getCanvasLayout(): Promise<CanvasLayout> {
  const notes = await db.notes.filter(n => !n.archived && !n.vault).toArray();
  const connections = await db.canvasConnections.toArray();

  // Assign default positions to notes without canvas coords
  const layoutNotes = notes.map((note, i) => ({
    ...note,
    x: note.canvasX ?? 100 + (i % 5) * 220,
    y: note.canvasY ?? 100 + Math.floor(i / 5) * 180,
  }));

  return { notes: layoutNotes, connections };
}

export async function saveNotePosition(noteId: string, x: number, y: number): Promise<void> {
  await db.notes.update(noteId, { canvasX: x, canvasY: y });
}

export async function createConnection(fromNoteId: string, toNoteId: string, label?: string, color?: string): Promise<CanvasConnection> {
  const conn: CanvasConnection = {
    id: crypto.randomUUID(),
    fromNoteId,
    toNoteId,
    label,
    color,
    createdAt: new Date(),
  };
  await db.canvasConnections.add(conn);
  return conn;
}

export async function updateConnection(id: string, updates: Partial<CanvasConnection>): Promise<void> {
  await db.canvasConnections.update(id, updates);
}

export async function deleteConnection(id: string): Promise<void> {
  await db.canvasConnections.delete(id);
}

export async function getConnectionsForNote(noteId: string): Promise<CanvasConnection[]> {
  const all = await db.canvasConnections.toArray();
  return all.filter(c => c.fromNoteId === noteId || c.toNoteId === noteId);
}

export function autoLayout(notes: { id: string; x: number; y: number }[], connections: CanvasConnection[]): { id: string; x: number; y: number }[] {
  // Simple force-directed layout
  const positions = notes.map(n => ({ id: n.id, x: n.x, y: n.y }));
  const iterations = 50;
  const repulsionForce = 5000;
  const attractionForce = 0.01;
  const idealDistance = 250;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsionForce / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        positions[i].x -= fx;
        positions[i].y -= fy;
        positions[j].x += fx;
        positions[j].y += fy;
      }
    }

    // Attraction along connections
    for (const conn of connections) {
      const from = positions.find(p => p.id === conn.fromNoteId);
      const to = positions.find(p => p.id === conn.toNoteId);
      if (!from || !to) continue;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = (dist - idealDistance) * attractionForce;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      from.x += fx;
      from.y += fy;
      to.x -= fx;
      to.y -= fy;
    }
  }

  // Ensure no negative positions
  const minX = Math.min(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  if (minX < 50) positions.forEach(p => p.x += (50 - minX));
  if (minY < 50) positions.forEach(p => p.y += (50 - minY));

  return positions;
}
