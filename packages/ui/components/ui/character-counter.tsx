'use client';

import { cn } from '../../lib/utils';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
  showWarning?: boolean;
  warningThreshold?: number; // Percentage (e.g., 90 for 90%)
}

/**
 * CharacterCounter Component
 * Displays character count with optional warning when approaching limit
 */
export function CharacterCounter({
  current,
  max,
  className,
  showWarning = true,
  warningThreshold = 90,
}: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = showWarning && percentage >= warningThreshold;
  const isOverLimit = current > max;

  return (
    <span
      className={cn(
        'text-xs font-medium transition-colors',
        isOverLimit && 'text-red-600',
        isNearLimit && !isOverLimit && 'text-orange-500',
        !isNearLimit && !isOverLimit && 'text-gray-500',
        className
      )}
      aria-label={`${current} of ${max} characters used`}
    >
      {current}/{max}
    </span>
  );
}

export default CharacterCounter;
