import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function VerifiedBadge({
  size = 'md',
  showLabel = false,
  className = ''
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      className={`inline-flex items-center gap-1.5 ${className}`}
      title="Compte vérifié"
    >
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-green-500 rounded-full blur-md opacity-60 animate-pulse`} />

        {/* Icon */}
        <ShieldCheck
          className={`${sizeClasses[size]} text-green-400 relative z-10`}
          fill="currentColor"
        />
      </div>

      {showLabel && (
        <span className={`${labelSizeClasses[size]} font-semibold text-green-400`}>
          Vérifié
        </span>
      )}
    </motion.div>
  );
}
