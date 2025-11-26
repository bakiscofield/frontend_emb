'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string;
  hover?: boolean;
  onClick?: (e?: any) => void;
  [key: string]: any; // Allow any additional props
}

export default function GlassCard({
  children,
  className = '',
  glow = false,
  glowColor = 'cyan',
  hover = true,
  ...props
}: GlassCardProps) {
  const glowColors = {
    cyan: 'shadow-cyan-500/50',
    purple: 'shadow-purple-500/50',
    pink: 'shadow-pink-500/50',
    blue: 'shadow-blue-500/50',
    green: 'shadow-green-500/50',
    orange: 'shadow-orange-500/50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { y: -5, scale: 1.02 } : undefined}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/10 backdrop-blur-xl
        border border-white/20
        ${glow ? `shadow-2xl ${glowColors[glowColor as keyof typeof glowColors] || glowColors.cyan}` : 'shadow-xl'}
        ${className}
      `}
      {...props}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Animated border glow */}
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0"
          animate={{
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `linear-gradient(45deg, transparent, ${glowColor === 'cyan' ? '#06b6d4' : glowColor}, transparent)`,
          }}
        />
      )}
    </motion.div>
  );
}
