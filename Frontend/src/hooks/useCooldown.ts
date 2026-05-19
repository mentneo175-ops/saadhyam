import { useState, useEffect, useCallback } from 'react';

interface UseCooldownOptions {
  cooldownMinutes?: number;
  storageKey: string;
}

interface UseCooldownReturn {
  canExecute: boolean;
  remainingTime: number;
  execute: () => void;
  reset: () => void;
}

/**
 * Hook to enforce cooldown period between actions
 * @param cooldownMinutes - Cooldown duration in minutes (default: 120 = 2 hours)
 * @param storageKey - Unique key for localStorage to track cooldown per feature
 */
export const useCooldown = ({
  cooldownMinutes = 120,
  storageKey,
}: UseCooldownOptions): UseCooldownReturn => {
  const [lastExecutionTime, setLastExecutionTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Load last execution time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setLastExecutionTime(parseInt(stored, 10));
    }
  }, [storageKey]);

  // Calculate remaining time
  useEffect(() => {
    const calculateRemaining = () => {
      if (!lastExecutionTime) {
        setRemainingTime(0);
        return;
      }

      const now = Date.now();
      const cooldownMs = cooldownMinutes * 60 * 1000;
      const elapsed = now - lastExecutionTime;
      const remaining = Math.max(0, cooldownMs - elapsed);

      setRemainingTime(remaining);
    };

    calculateRemaining();

    // Update every second
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lastExecutionTime, cooldownMinutes]);

  const canExecute = remainingTime === 0;

  const execute = useCallback(() => {
    const now = Date.now();
    setLastExecutionTime(now);
    localStorage.setItem(storageKey, now.toString());
  }, [storageKey]);

  const reset = useCallback(() => {
    setLastExecutionTime(null);
    localStorage.removeItem(storageKey);
    setRemainingTime(0);
  }, [storageKey]);

  return {
    canExecute,
    remainingTime,
    execute,
    reset,
  };
};

/**
 * Format remaining time in human-readable format
 */
export const formatCooldownTime = (milliseconds: number): string => {
  if (milliseconds === 0) return 'Available now';

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
};
