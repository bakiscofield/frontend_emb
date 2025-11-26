'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, FileText, ExternalLink, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentSyntaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  syntaxType: 'TEXTE' | 'LIEN' | 'AUTRE';
  syntaxValue: string;
  totalAmount: number;
}

export default function PaymentSyntaxModal({
  isOpen,
  onClose,
  syntaxType,
  syntaxValue,
  totalAmount
}: PaymentSyntaxModalProps) {
  const [copied, setCopied] = useState(false);

  // Remplacer {montant} par le montant total dans le texte
  const processedSyntax = syntaxValue.replace(/{montant}/g, totalAmount.toString());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(processedSyntax);
      setCopied(true);
      toast.success('Syntaxe copiée!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const renderContent = () => {
    switch (syntaxType) {
      case 'TEXTE':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-red-500/20 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Instructions de Paiement</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Veuillez suivre ces instructions</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border-2 border-red-500/30 rounded-xl p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <p className="text-white text-sm sm:text-base md:text-lg font-mono leading-relaxed whitespace-pre-wrap flex-1">
                  {processedSyntax}
                </p>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-1.5 sm:p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  title="Copier la syntaxe"
                >
                  {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
              <p className="text-yellow-400 text-xs sm:text-sm">
                <span className="font-semibold">Montant à payer:</span> {totalAmount} FCFA
              </p>
            </div>

            <div className="text-gray-400 text-xs sm:text-sm">
              Une fois le paiement effectué, veuillez envoyer la référence de paiement comme indiqué.
              Votre transaction sera validée par un administrateur.
            </div>
          </div>
        );

      case 'LIEN':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
                <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Lien de Paiement</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Cliquez pour effectuer le paiement</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border-2 border-blue-500/30 rounded-xl p-3 sm:p-4 md:p-6">
              <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm">
                Pour finaliser votre transaction, veuillez suivre le lien ci-dessous :
              </p>

              <a
                href={syntaxValue}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 sm:p-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold mb-1 text-sm sm:text-base">Ouvrir le lien de paiement</div>
                      <div className="text-blue-100 text-xs sm:text-sm truncate">{syntaxValue}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </div>
                </div>
              </a>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
              <p className="text-yellow-400 text-xs sm:text-sm">
                <span className="font-semibold">Montant à payer:</span> {totalAmount} FCFA
              </p>
            </div>

            <div className="text-gray-400 text-xs sm:text-sm">
              Le lien s'ouvrira dans un nouvel onglet. Une fois le paiement effectué,
              votre transaction sera automatiquement enregistrée et validée par un administrateur.
            </div>
          </div>
        );

      case 'AUTRE':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Instructions Spéciales</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Informations importantes</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border-2 border-purple-500/30 rounded-xl p-3 sm:p-4 md:p-6">
              <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                {processedSyntax}
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
              <p className="text-yellow-400 text-xs sm:text-sm">
                <span className="font-semibold">Montant total:</span> {totalAmount} FCFA
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-red-500/30 shadow-2xl shadow-red-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Transaction Créée</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">Détails de paiement</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {renderContent()}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 p-4 sm:p-6">
                <button
                  onClick={onClose}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all text-sm sm:text-base"
                >
                  J'ai compris
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
