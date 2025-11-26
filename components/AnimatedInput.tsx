'use client';

import { motion } from 'framer-motion';
import { InputHTMLAttributes, useState, ReactNode } from 'react';

interface AnimatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export default function AnimatedInput({
  label,
  error,
  icon,
  prefix,
  suffix,
  className = '',
  type = 'text',
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-medium text-gray-200 mb-2"
        >
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </motion.label>
      )}

      {/* Input container */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            relative flex items-center
            bg-white/5 backdrop-blur-sm
            border-2 rounded-xl
            transition-all duration-300
            ${
              isFocused
                ? 'border-cyan-500 shadow-lg shadow-cyan-500/30'
                : error
                ? 'border-red-500'
                : 'border-white/20 hover:border-white/40'
            }
          `}
        >
          {/* Icon */}
          {icon && (
            <div className="absolute left-4 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Prefix */}
          {prefix && (
            <div className="pl-4 text-gray-400 font-medium">
              {prefix}
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              flex-1 w-full
              ${icon ? 'pl-12' : prefix ? 'pl-2' : 'pl-4'}
              ${suffix ? 'pr-12' : 'pr-4'}
              py-3
              bg-transparent
              text-white placeholder-gray-400
              outline-none
              ${className}
            `}
            {...props}
          />

          {/* Suffix */}
          {suffix && (
            <div className="pr-4 text-gray-400">
              {suffix}
            </div>
          )}

          {/* Animated underline glow */}
          {isFocused && (
            <motion.div
              layoutId="input-glow"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-400 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
}
