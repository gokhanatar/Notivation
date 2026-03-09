import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotes } from '@/hooks/useNotes';
import { useTranslation } from '@/lib/i18n';
import { parseWikilinks } from '@/lib/notes/wikilinks';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { type Note, type NoteType } from '@/lib/db';
import { hapticLight } from '@/lib/native/haptics';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Filter,
  Scale,
  CheckSquare,
  Info,
  Lightbulb,
  Clock,
  HelpCircle,
  BookOpen,
  Link2,
} from 'lucide-react';

interface NoteGraphModalProps {
  open: boolean;
  onClose: () => void;
  onNoteSelect: (noteId: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: NoteType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number;
  pinned: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
}

const NODE_TYPE_COLORS: Record<NoteType, string> = {
  decision: '#8b5cf6',
  action: '#10b981',
  info: '#3b82f6',
  idea: '#f59e0b',
  followup: '#f97316',
  question: '#ec4899',
  journal: '#6366f1',
};

const NODE_TYPE_ICONS: Record<NoteType, typeof Scale> = {
  decision: Scale,
  action: CheckSquare,
  info: Info,
  idea: Lightbulb,
  followup: Clock,
  question: HelpCircle,
  journal: BookOpen,
};

function buildGraph(notes: Note[]) {
  const activeNotes = notes.filter((n) => !n.archived);
  const titleMap = new Map<string, string>();
  activeNotes.forEach((n) => {
    const title = getDisplayTitle(n.title, n.body).toLowerCase();
    titleMap.set(title, n.id);
  });

  const edgeList: GraphEdge[] = [];
  const edgeSet = new Set<string>();
  activeNotes.forEach((n) => {
    const links = parseWikilinks(n.body);
    links.forEach((link) => {
      const targetId = titleMap.get(link.toLowerCase());
      if (targetId && targetId !== n.id) {
        const key = [n.id, targetId].sort().join('-');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edgeList.push({ source: n.id, target: targetId });
        }
      }
    });
  });

  // Count connections per node
  const connectionCount = new Map<string, number>();
  edgeList.forEach((e) => {
    connectionCount.set(e.source, (connectionCount.get(e.source) || 0) + 1);
    connectionCount.set(e.target, (connectionCount.get(e.target) || 0) + 1);
  });

  // Show connected first, then recent unconnected (up to 30 total)
  const connectedIds = new Set<string>();
  edgeList.forEach((e) => {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  });

  const connected = activeNotes.filter((n) => connectedIds.has(n.id));
  const unconnected = activeNotes
    .filter((n) => !connectedIds.has(n.id))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, Math.max(0, 30 - connected.length));
  const shown = [...connected, ...unconnected];

  const nodeList: GraphNode[] = shown.map((n, i) => {
    const angle = (i / shown.length) * Math.PI * 2;
    const conns = connectionCount.get(n.id) || 0;
    const r = conns > 0 ? 60 + Math.random() * 80 : 120 + Math.random() * 80;
    return {
      id: n.id,
      label: getDisplayTitle(n.title, n.body).slice(0, 24),
      type: n.type,
      x: 250 + Math.cos(angle) * r,
      y: 250 + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
      connections: conns,
      pinned: n.pinned,
    };
  });

  return { nodes: nodeList, edges: edgeList };
}

export function NoteGraphModal({ open, onClose, onNoteSelect }: NoteGraphModalProps) {
  const notes = useNotes();
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const nodesRef = useRef<GraphNode[]>([]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NoteType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [, forceUpdate] = useState(0);

  // Drag state
  const dragRef = useRef<{
    id: string | null;
    startX: number;
    startY: number;
    isPanning: boolean;
    panStartX: number;
    panStartY: number;
  }>({ id: null, startX: 0, startY: 0, isPanning: false, panStartX: 0, panStartY: 0 });

  const { nodes: initialNodes, edges } = useMemo(() => buildGraph(notes), [notes]);

  // Stats
  const stats = useMemo(() => {
    const typeCount: Partial<Record<NoteType, number>> = {};
    initialNodes.forEach((n) => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });
    return {
      totalNodes: initialNodes.length,
      totalEdges: edges.length,
      connectedNodes: initialNodes.filter((n) => n.connections > 0).length,
      typeCount,
    };
  }, [initialNodes, edges]);

  // Filter and search nodes
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    nodesRef.current.forEach((n) => {
      const matchesFilter = activeFilter === 'all' || n.type === activeFilter;
      const matchesSearch =
        !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase());
      if (matchesFilter && matchesSearch) ids.add(n.id);
    });
    return ids;
  }, [activeFilter, searchQuery, initialNodes]);

  // Initialize nodes
  useEffect(() => {
    if (!open) return;
    nodesRef.current = initialNodes.map((n) => ({ ...n }));
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setSearchQuery('');
    setShowSearch(false);
    setActiveFilter('all');
    setShowFilters(false);
  }, [open, initialNodes]);

  // Physics simulation
  useEffect(() => {
    if (!open) return;
    let iterations = 0;

    const simulate = () => {
      const ns = nodesRef.current;
      if (ns.length === 0) return;

      const W = 500,
        H = 500;
      const damping = iterations < 60 ? 0.85 : 0.92;

      for (let i = 0; i < ns.length; i++) {
        if (dragRef.current.id === ns[i].id) continue;

        let fx = 0,
          fy = 0;

        // Center gravity
        fx += (W / 2 - ns[i].x) * 0.002;
        fy += (H / 2 - ns[i].y) * 0.002;

        // Repulsion between nodes
        for (let j = 0; j < ns.length; j++) {
          if (i === j) continue;
          const dx = ns[i].x - ns[j].x;
          const dy = ns[i].y - ns[j].y;
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f = 1200 / (d * d);
          fx += (dx / d) * f;
          fy += (dy / d) * f;
        }

        // Attraction via edges
        edges.forEach((e) => {
          let other = -1;
          if (e.source === ns[i].id) other = ns.findIndex((n) => n.id === e.target);
          else if (e.target === ns[i].id) other = ns.findIndex((n) => n.id === e.source);
          if (other >= 0) {
            const dx = ns[other].x - ns[i].x;
            const dy = ns[other].y - ns[i].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const idealDist = 80;
            const strength = (d - idealDist) * 0.008;
            fx += (dx / Math.max(d, 1)) * strength;
            fy += (dy / Math.max(d, 1)) * strength;
          }
        });

        ns[i].vx = (ns[i].vx + fx) * damping;
        ns[i].vy = (ns[i].vy + fy) * damping;
        ns[i].x += ns[i].vx;
        ns[i].y += ns[i].vy;
        ns[i].x = Math.max(40, Math.min(W - 40, ns[i].x));
        ns[i].y = Math.max(40, Math.min(H - 40, ns[i].y));
      }

      iterations++;
      forceUpdate((v) => v + 1);
      animRef.current = requestAnimationFrame(simulate);
    };

    animRef.current = requestAnimationFrame(simulate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [open, edges]);

  // Coordinate transform helpers
  const screenToGraph = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const svgW = rect.width;
      const svgH = rect.height;
      return {
        x: ((clientX - rect.left) / svgW) * 500 / zoom - pan.x / zoom,
        y: ((clientY - rect.top) / svgH) * 500 / zoom - pan.y / zoom,
      };
    },
    [zoom, pan]
  );

  // Touch/mouse handlers for nodes
  const handleNodePointerDown = (nodeId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { id: nodeId, startX: e.clientX, startY: e.clientY, isPanning: false, panStartX: 0, panStartY: 0 };
  };

  const handleNodePointerUp = (nodeId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const dx = Math.abs(e.clientX - dragRef.current.startX);
    const dy = Math.abs(e.clientY - dragRef.current.startY);
    if (dx < 5 && dy < 5) {
      // Tap — select node
      hapticLight();
      setSelectedNode(nodeId === selectedNode ? null : nodeId);
    }
    dragRef.current.id = null;
  };

  // Pan handlers
  const handleBgPointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      id: null,
      startX: e.clientX,
      startY: e.clientY,
      isPanning: true,
      panStartX: pan.x,
      panStartY: pan.y,
    };
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current.id) {
        // Drag node
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const scaleX = 500 / rect.width / zoom;
        const scaleY = 500 / rect.height / zoom;
        const node = nodesRef.current.find((n) => n.id === dragRef.current.id);
        if (node) {
          node.x += (e.clientX - dragRef.current.startX) * scaleX;
          node.y += (e.clientY - dragRef.current.startY) * scaleY;
          node.vx = 0;
          node.vy = 0;
          dragRef.current.startX = e.clientX;
          dragRef.current.startY = e.clientY;
        }
      } else if (dragRef.current.isPanning) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPan({
          x: dragRef.current.panStartX + dx,
          y: dragRef.current.panStartY + dy,
        });
      }
    },
    [zoom]
  );

  const handlePointerUp = () => {
    dragRef.current.id = null;
    dragRef.current.isPanning = false;
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.3, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.3, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleOpenNote = () => {
    if (selectedNode) {
      onNoteSelect(selectedNode);
    }
  };

  if (!open) return null;

  const currentNodes = nodesRef.current;
  const selectedNodeData = selectedNode ? currentNodes.find((n) => n.id === selectedNode) : null;
  const selectedNoteData = selectedNode ? notes.find((n) => n.id === selectedNode) : null;

  // Connections for selected node
  const selectedConnections = selectedNode
    ? edges.filter((e) => e.source === selectedNode || e.target === selectedNode)
    : [];

  const noteTypes: NoteType[] = ['decision', 'action', 'info', 'idea', 'followup', 'question', 'journal'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col safe-top safe-bottom"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 className="w-5 h-5 text-primary flex-shrink-0" />
            <h2 className="font-semibold text-base truncate">{t('pro.noteGraph')}</h2>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {stats.totalNodes} {t('graph.notes')} · {stats.totalEdges} {t('graph.connections')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center tap-target flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomOut}
              className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center tap-target"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center tap-target"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center tap-target"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setShowFilters(!showFilters); setShowSearch(false); }}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center tap-target',
                showFilters || activeFilter !== 'all' ? 'bg-primary/10 text-primary' : 'bg-muted/60'
              )}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowSearch(!showSearch); setShowFilters(false); }}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center tap-target',
                showSearch ? 'bg-primary/10 text-primary' : 'bg-muted/60'
              )}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border/50"
            >
              <div className="px-4 py-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder') || 'Search notes...'}
                  className="w-full h-10 px-3 rounded-lg bg-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border/50"
            >
              <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap tap-target',
                    activeFilter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground'
                  )}
                >
                  {t('graph.all')} ({stats.totalNodes})
                </button>
                {noteTypes.map((type) => {
                  const count = stats.typeCount[type] || 0;
                  if (count === 0) return null;
                  const Icon = NODE_TYPE_ICONS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type === activeFilter ? 'all' : type)}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap tap-target',
                        activeFilter === type
                          ? 'text-white'
                          : 'bg-muted/60 text-muted-foreground'
                      )}
                      style={
                        activeFilter === type
                          ? { backgroundColor: NODE_TYPE_COLORS[type] }
                          : undefined
                      }
                    >
                      <Icon className="w-3 h-3" />
                      {count}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Graph Area */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-card"
          style={{ touchAction: 'none' }}
          onPointerDown={handleBgPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {currentNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-8">
                <Link2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {t('graph.tapToOpen')}
                </p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              viewBox="0 0 500 500"
              className="w-full h-full"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center center',
              }}
            >
              {/* Edges */}
              {edges.map((edge, i) => {
                const source = currentNodes.find((n) => n.id === edge.source);
                const target = currentNodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;

                const sourceVisible = visibleNodeIds.has(source.id);
                const targetVisible = visibleNodeIds.has(target.id);
                if (!sourceVisible && !targetVisible) return null;

                const isSelected =
                  selectedNode &&
                  (edge.source === selectedNode || edge.target === selectedNode);

                return (
                  <line
                    key={`edge-${i}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isSelected ? NODE_TYPE_COLORS[source.type] : 'currentColor'}
                    strokeOpacity={isSelected ? 0.6 : 0.12}
                    strokeWidth={isSelected ? 2.5 : 1}
                    strokeDasharray={!sourceVisible || !targetVisible ? '4 4' : undefined}
                  />
                );
              })}

              {/* Nodes */}
              {currentNodes.map((node) => {
                const isVisible = visibleNodeIds.has(node.id);
                const isSelected = node.id === selectedNode;
                const isConnectedToSelected = selectedConnections.some(
                  (e) => e.source === node.id || e.target === node.id
                );
                const radius = node.connections > 3 ? 14 : node.connections > 0 ? 10 : 6;
                const color = NODE_TYPE_COLORS[node.type];

                return (
                  <g
                    key={node.id}
                    style={{
                      opacity: isVisible
                        ? selectedNode
                          ? isSelected || isConnectedToSelected
                            ? 1
                            : 0.2
                          : 1
                        : 0.08,
                      cursor: 'pointer',
                    }}
                    onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                    onPointerUp={(e) => handleNodePointerUp(node.id, e)}
                  >
                    {/* Selection glow */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius + 6}
                        fill={color}
                        opacity={0.15}
                      >
                        <animate
                          attributeName="r"
                          values={`${radius + 4};${radius + 8};${radius + 4}`}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Node circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill={color}
                      stroke={isSelected ? 'white' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                    />

                    {/* Label */}
                    {(radius > 6 || isSelected || zoom > 1.2) && (
                      <text
                        x={node.x}
                        y={node.y + radius + 11}
                        textAnchor="middle"
                        fontSize={isSelected ? 11 : 9}
                        fontWeight={isSelected ? 600 : 400}
                        fill="currentColor"
                        opacity={isSelected ? 1 : 0.7}
                        className="pointer-events-none select-none"
                      >
                        {node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label}
                      </text>
                    )}

                    {/* Connection count badge */}
                    {node.connections > 1 && !isSelected && (
                      <>
                        <circle
                          cx={node.x + radius * 0.7}
                          cy={node.y - radius * 0.7}
                          r={6}
                          fill="hsl(var(--background))"
                          stroke={color}
                          strokeWidth={1}
                        />
                        <text
                          x={node.x + radius * 0.7}
                          y={node.y - radius * 0.7 + 3}
                          textAnchor="middle"
                          fontSize={7}
                          fontWeight={700}
                          fill={color}
                          className="pointer-events-none select-none"
                        >
                          {node.connections}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Selected Node Detail Panel */}
        <AnimatePresence>
          {selectedNodeData && selectedNoteData && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 safe-bottom"
            >
              <div className="mx-3 mb-3 rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Type indicator */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: NODE_TYPE_COLORS[selectedNodeData.type] + '20' }}
                    >
                      {(() => {
                        const Icon = NODE_TYPE_ICONS[selectedNodeData.type];
                        return (
                          <Icon
                            className="w-5 h-5"
                            style={{ color: NODE_TYPE_COLORS[selectedNodeData.type] }}
                          />
                        );
                      })()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {getDisplayTitle(selectedNoteData.title, selectedNoteData.body)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedNodeData.type} · {selectedConnections.length} {t('graph.connections')}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedNode(null)}
                      className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Connected notes */}
                  {selectedConnections.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1.5">{t('graph.connectedNotes')}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedConnections.map((edge, i) => {
                          const otherId =
                            edge.source === selectedNode ? edge.target : edge.source;
                          const otherNode = currentNodes.find((n) => n.id === otherId);
                          if (!otherNode) return null;
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                hapticLight();
                                setSelectedNode(otherId);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 text-xs tap-target"
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: NODE_TYPE_COLORS[otherNode.type] }}
                              />
                              <span className="truncate max-w-[120px]">{otherNode.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Open Note button */}
                  <button
                    onClick={handleOpenNote}
                    className="w-full mt-3 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium tap-target"
                  >
                    {t('graph.openNote')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend (only when no node selected) */}
        {!selectedNode && (
          <div className="px-4 py-2 border-t border-border/50">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {noteTypes.map((type) => {
                if (!stats.typeCount[type]) return null;
                return (
                  <div key={type} className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
                    />
                    <span className="text-[11px] text-muted-foreground capitalize">{type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
