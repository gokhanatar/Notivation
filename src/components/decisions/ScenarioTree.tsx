import { motion } from 'framer-motion';
import type { Scenario, ScenarioOutcome } from '@/lib/db';

interface ScenarioTreeProps {
  scenario: Scenario & { outcomes: ScenarioOutcome[] };
}

export function ScenarioTree({ scenario }: ScenarioTreeProps) {
  const outcomeCount = scenario.outcomes.length;
  const rowHeight = 80;
  const height = Math.max(160, outcomeCount * rowHeight);
  const width = 400;

  // Layout
  const rootX = 30;
  const rootY = height / 2;
  const rootRx = 8;
  const rootWidth = 120;
  const rootHeight = 36;

  const outcomeStartX = 260;
  const outcomeWidth = 120;
  const outcomeHeight = 32;

  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height: `${height}px`, maxHeight: `${height}px` }}
    >
      {/* Root node (condition) */}
      <rect
        x={rootX}
        y={rootY - rootHeight / 2}
        width={rootWidth}
        height={rootHeight}
        rx={rootRx}
        className="fill-blue-500/20 stroke-blue-500"
        strokeWidth={1.5}
      />
      <text
        x={rootX + rootWidth / 2}
        y={rootY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-blue-600 dark:fill-blue-400 text-[10px] font-medium"
      >
        {truncateText(scenario.condition, 16)}
      </text>

      {/* Branches and outcome nodes */}
      {scenario.outcomes.map((outcome, index) => {
        const totalOutcomes = scenario.outcomes.length;
        const spacing = totalOutcomes > 1
          ? (height - 60) / (totalOutcomes - 1)
          : 0;
        const outcomeY = totalOutcomes > 1
          ? 30 + index * spacing
          : height / 2;

        const isActual = outcome.isActual;

        // Branch line control points
        const lineStartX = rootX + rootWidth;
        const lineStartY = rootY;
        const lineEndX = outcomeStartX;
        const lineEndY = outcomeY;
        const controlX = (lineStartX + lineEndX) / 2;

        return (
          <motion.g
            key={outcome.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
          >
            {/* Branch line */}
            <path
              d={`M ${lineStartX} ${lineStartY} C ${controlX} ${lineStartY}, ${controlX} ${lineEndY}, ${lineEndX} ${lineEndY}`}
              fill="none"
              className={isActual ? 'stroke-green-500' : 'stroke-slate-300 dark:stroke-slate-600'}
              strokeWidth={isActual ? 2 : 1.2}
              strokeDasharray={isActual ? undefined : '4 2'}
            />

            {/* Outcome node */}
            <rect
              x={outcomeStartX}
              y={outcomeY - outcomeHeight / 2}
              width={outcomeWidth}
              height={outcomeHeight}
              rx={6}
              className={
                isActual
                  ? 'fill-green-500/20 stroke-green-500'
                  : 'fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600'
              }
              strokeWidth={isActual ? 1.5 : 1}
            />

            {/* Outcome description */}
            <text
              x={outcomeStartX + outcomeWidth / 2}
              y={outcomeY - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-[9px] font-medium ${
                isActual
                  ? 'fill-green-700 dark:fill-green-300'
                  : 'fill-slate-600 dark:fill-slate-300'
              }`}
            >
              {truncateText(outcome.description, 16)}
            </text>

            {/* Probability badge */}
            <text
              x={outcomeStartX + outcomeWidth / 2}
              y={outcomeY + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-[8px] ${
                isActual
                  ? 'fill-green-600 dark:fill-green-400'
                  : 'fill-slate-400 dark:fill-slate-500'
              }`}
            >
              {outcome.probability}%
            </text>
          </motion.g>
        );
      })}
    </motion.svg>
  );
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '\u2026';
}
