'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface NeonButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  neonEffect?: boolean;
}

export default function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  neonEffect = true,
  className = '',
  disabled,
  ...props
}: NeonButtonProps) {
  const variants = {
    primary: {
      bg: 'bg-gradient-to-r from-cyan-500 to-blue-600',
      shadow: 'shadow-cyan-500/50',
      hoverShadow: 'hover:shadow-cyan-500/75',
      text: 'text-white'
    },
    secondary: {
      bg: 'bg-gradient-to-r from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/50',
      hoverShadow: 'hover:shadow-purple-500/75',
      text: 'text-white'
    },
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      shadow: 'shadow-green-500/50',
      hoverShadow: 'hover:shadow-green-500/75',
      text: 'text-white'
    },
    danger: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-600',
      shadow: 'shadow-red-500/50',
      hoverShadow: 'hover:shadow-red-500/75',
      text: 'text-white'
    },
    warning: {
      bg: 'bg-gradient-to-r from-orange-500 to-yellow-600',
      shadow: 'shadow-orange-500/50',
      hoverShadow: 'hover:shadow-orange-500/75',
      text: 'text-white'
    }
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const currentVariant = variants[variant];

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.05 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.95 } : undefined}
      className={`
        relative overflow-hidden rounded-xl font-semibold
        ${currentVariant.bg}
        ${currentVariant.text}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${neonEffect ? `shadow-lg ${currentVariant.shadow} ${currentVariant.hoverShadow}` : 'shadow-md'}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-300
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shine effect */}
      {!disabled && !loading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </span>

      {/* Neon glow pulse */}
      {neonEffect && !disabled && !loading && (
        <motion.div
          className={`absolute inset-0 rounded-xl ${currentVariant.shadow} opacity-0`}
          animate={{
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.button>
  );
}
