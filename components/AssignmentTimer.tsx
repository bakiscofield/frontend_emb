'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface AssignmentTimerProps {
  expiresAt: string;
  onExpired?: () => void;
}

export default function AssignmentTimer({ expiresAt, onExpired }: AssignmentTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);

  useEffect(() => {
    const expiresDate = new Date(expiresAt).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresDate - now) / 1000));

    // Estimer le temps total comme 5 minutes (300 secondes) par défaut
    // ou utiliser le temps restant comme référence si plus grand
    const total = Math.max(remaining, 300);
    setTotalTime(total);
    setTimeLeft(remaining);

    if (remaining <= 0) {
      onExpired?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onExpired?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  // Couleur basée sur le temps restant
  const getColor = () => {
    if (progress > 60) return { bar: 'bg-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' };
    if (progress > 30) return { bar: 'bg-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' };
    return { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' };
  };

  const color = getColor();

  if (timeLeft <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-red-400 text-xs">
        <Clock className="w-3 h-3 animate-pulse" />
        <span>Expiré</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Clock className={`w-3 h-3 ${color.text}`} />
        <span className={`text-xs font-mono font-medium ${color.text}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      <div className={`h-1 bg-gray-700 rounded-full overflow-hidden shadow-sm ${color.glow}`}>
        <div
          className={`h-full ${color.bar} rounded-full transition-all duration-1000 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
