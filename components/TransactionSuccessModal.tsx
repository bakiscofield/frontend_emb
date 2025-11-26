'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  amount: number;
  totalAmount: number;
  fromMethod: string;
  toMethod: string;
}

export default function TransactionSuccessModal({
  isOpen,
  onClose,
  transactionId,
  amount,
  totalAmount,
  fromMethod,
  toMethod
}: TransactionSuccessModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 30);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

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
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl sm:rounded-3xl border-2 border-red-500/30 shadow-2xl shadow-red-500/20 max-w-lg w-full overflow-hidden max-h-[95vh] overflow-y-auto">
              {/* Animated background effect */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{
                    background: [
                      'radial-gradient(circle at 0% 0%, #ef4444 0%, transparent 50%)',
                      'radial-gradient(circle at 100% 100%, #ef4444 0%, transparent 50%)',
                      'radial-gradient(circle at 0% 100%, #ef4444 0%, transparent 50%)',
                      'radial-gradient(circle at 100% 0%, #ef4444 0%, transparent 50%)',
                      'radial-gradient(circle at 0% 0%, #ef4444 0%, transparent 50%)',
                    ],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 hover:bg-white/10 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-white" />
              </button>

              {/* Content */}
              <div className="relative p-4 sm:p-6 md:p-8">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-3 sm:mb-4"
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-green-500/30 rounded-full blur-xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 sm:p-4">
                      <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2"
                >
                  <span className="bg-gradient-to-r from-green-400 via-green-300 to-emerald-400 bg-clip-text text-transparent">
                    Transaction Créée !
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6"
                >
                  Votre demande d'échange a été enregistrée avec succès
                </motion.p>

                {/* Transaction Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-red-500/30 p-3 sm:p-4 mb-4 sm:mb-6 space-y-2 sm:space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs sm:text-sm">ID Transaction</span>
                    <span className="text-white font-mono text-xs sm:text-sm font-semibold">{transactionId}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3">
                    <div className="flex-1 text-center">
                      <div className="text-red-400 font-semibold text-sm sm:text-base">{fromMethod}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                    <div className="flex-1 text-center">
                      <div className="text-green-400 font-semibold text-sm sm:text-base">{toMethod}</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-3 sm:pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs sm:text-sm">Montant</span>
                      <span className="text-white font-semibold text-sm sm:text-base">{amount} FCFA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs sm:text-sm">Total</span>
                      <span className="text-green-400 font-bold text-base sm:text-lg">{totalAmount} FCFA</span>
                    </div>
                  </div>
                </motion.div>

                {/* Status Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-yellow-400 font-semibold text-sm sm:text-base mb-2">⏱️ Transfert en cours de vérification</h3>
                      <p className="text-yellow-300/80 text-xs sm:text-sm leading-relaxed mb-3">
                        Le transfert sera effectué après vérification de votre paiement.
                        <span className="font-semibold text-yellow-400"> Veuillez patienter environ 10 minutes.</span>
                      </p>
                      <p className="text-yellow-300/80 text-xs sm:text-sm leading-relaxed">
                        Si votre transaction n'est pas validée dans ce délai, veuillez contacter notre
                        <span className="font-semibold text-yellow-400"> service client</span> pour assistance.
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-400 text-xs font-medium">Vérification en cours...</span>
                      <span className="text-yellow-400 text-xs font-mono">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Action Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={onClose}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/50 text-sm sm:text-base"
                >
                  J'ai compris
                </motion.button>

                {/* Info text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center text-gray-500 text-xs sm:text-sm mt-4"
                >
                  Vous pouvez consulter l'état de votre transaction dans l'historique
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
