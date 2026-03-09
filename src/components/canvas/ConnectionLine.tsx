import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface ConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string;
  color?: string;
  onDelete?: () => void;
}

export function ConnectionLine({ fromX, fromY, toX, toY, label, color, onDelete }: ConnectionLineProps) {
  const [showDelete, setShowDelete] = useState(false);

  const strokeColor = color || 'var(--border)';

  // Control points offset horizontally for a nice curve
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const dx = toX - fromX;
  const cpOffset = Math.min(Math.abs(dx) * 0.4, 120);

  const path = `M ${fromX} ${fromY} C ${fromX + cpOffset} ${fromY}, ${toX - cpOffset} ${toY}, ${toX} ${toY}`;

  const markerId = `arrowhead-${fromX}-${fromY}-${toX}-${toY}`.replace(/\./g, '_');

  return (
    <g>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
        </marker>
      </defs>

      {/* Invisible wider path for easier click target */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          setShowDelete(prev => !prev);
        }}
      />

      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        markerEnd={`url(#${markerId})`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Optional label at midpoint */}
      {label && (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
          style={{ pointerEvents: 'none', fontSize: '11px' }}
        >
          {label}
        </text>
      )}

      {/* Delete button at midpoint */}
      {showDelete && onDelete && (
        <foreignObject x={midX - 14} y={midY - 14} width={28} height={28}>
          <button
            className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setShowDelete(false);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </foreignObject>
      )}
    </g>
  );
}
