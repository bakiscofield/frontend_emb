'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Calendar, Percent } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode: {
    code: string;
    discount_percent: number;
    valid_until: string;
  };
}

export default function PromoCodeModal({
  isOpen,
  onClose,
  promoCode
}: PromoCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 rounded-2xl sm:rounded-3xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30 max-w-lg w-full overflow-hidden">
              {/* Animated background effect */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{
                    background: [
                      'radial-gradient(circle at 0% 0%, #a855f7 0%, transparent 50%)',
                      'radial-gradient(circle at 100% 100%, #ec4899 0%, transparent 50%)',
                      'radial-gradient(circle at 0% 100%, #ef4444 0%, transparent 50%)',
                      'radial-gradient(circle at 100% 0%, #a855f7 0%, transparent 50%)',
                      'radial-gradient(circle at 0% 0%, #a855f7 0%, transparent 50%)',
                    ],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                {/* Confetti effect */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{
                      x: Math.random() * 400,
                      y: -20,
                      opacity: 1
                    }}
                    animate={{
                      y: 600,
                      opacity: 0,
                      rotate: Math.random() * 360
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 hover:bg-white/10 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 hover:text-white" />
              </button>

              {/* Content */}
              <div className="relative p-4 sm:p-6 md:p-8">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-4"
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-yellow-400/40 rounded-full blur-xl"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-4">
                      <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 bg-clip-text text-transparent">
                      Offre Spéciale !
                    </span>
                  </h2>
                  <p className="text-white/80 text-sm sm:text-base">
                    Profitez de votre code promo exclusif
                  </p>
                </motion.div>

                {/* Promo Code Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-2xl p-4 sm:p-6 mb-6"
                >
                  <div className="text-center mb-4">
                    <p className="text-white/70 text-xs sm:text-sm mb-2">Votre code promo</p>
                    <div
                      onClick={handleCopy}
                      className="relative group cursor-pointer"
                    >
                      <motion.div
                        className="text-3xl sm:text-4xl md:text-5xl font-black tracking-wider"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 bg-clip-text text-transparent drop-shadow-lg">
                          {promoCode.code}
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: copied ? 1 : 0, y: copied ? 0 : 10 }}
                        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap"
                      >
                        Copié !
                      </motion.div>
                      <p className="text-white/50 text-xs mt-2 group-hover:text-white/70 transition-colors">
                        Cliquez pour copier
                      </p>
                    </div>
                  </div>

                  {/* Discount Info */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-3">
                      <Percent className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-xs text-green-300">Réduction</p>
                        <p className="text-xl font-bold text-green-400">{promoCode.discount_percent}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 rounded-xl px-4 py-3">
                      <Calendar className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-xs text-orange-300">Valide jusqu'au</p>
                        <p className="text-sm font-bold text-orange-400">{formatDate(promoCode.valid_until)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6"
                >
                  <h3 className="text-blue-300 font-semibold text-sm mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Comment utiliser votre code ?
                  </h3>
                  <ul className="text-blue-200/80 text-xs sm:text-sm space-y-1 ml-7">
                    <li>1. Sélectionnez votre paire d'échange</li>
                    <li>2. Cliquez sur "J'ai un code promo"</li>
                    <li>3. Entrez le code <strong>{promoCode.code}</strong></li>
                    <li>4. Profitez de {promoCode.discount_percent}% de réduction sur les frais !</li>
                  </ul>
                </motion.div>

                {/* Action Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 hover:from-yellow-600 hover:via-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-500/50 text-sm sm:text-base"
                >
                  J'ai compris, allons-y !
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
