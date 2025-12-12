'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, History, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { exchangePairsAPI, transactionsAPI, settingsAPI } from '@/lib/api';
import GlassCard from '@/components/GlassCard';
import NeonButton from '@/components/NeonButton';
import AnimatedInput from '@/components/AnimatedInput';
import NotificationBell from '@/components/NotificationBell';
import NotificationSettings from '@/components/NotificationSettings';
import Header from '@/components/Header';
import PaymentSyntaxModal from '@/components/PaymentSyntaxModal';
import TransactionSuccessModal from '@/components/TransactionSuccessModal';
import ProfileModal from '@/components/ProfileModal';
import ChatWidget from '@/components/ChatWidget';
import AutoPushNotifications from '@/components/AutoPushNotifications';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

interface ExchangePair {
  id: number;
  from_method_name: string;
  from_method_icon: string;
  to_method_name: string;
  to_method_icon: string;
  fee_percentage: number;
  tax_amount: number;
  min_amount: number;
  max_amount: number;
  payment_syntax_type: 'TEXTE' | 'LIEN' | 'AUTRE';
  payment_syntax_value: string;
  category?: string;
  requires_additional_info?: boolean;
  instruction_title?: string;
  instruction_content?: string;
  instruction_link_url?: string;
  instruction_link_text?: string;
  from_number_label?: string;
  from_number_placeholder?: string;
  to_number_label?: string;
  to_number_placeholder?: string;
  show_to_number?: boolean;
  amount_label?: string;
  amount_placeholder?: string;
  reference_required?: boolean;
  reference_label?: string;
  reference_placeholder?: string;
  fields: Field[];
}

interface Field {
  id: number;
  field_name: string;
  field_type: string;
  field_label: string;
  placeholder: string;
  is_required: boolean;
  options: string | null;
}

interface Transaction {
  id: number;
  transaction_id: string;
  amount: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, initAuth } = useAuthStore();
  const [pairs, setPairs] = useState<ExchangePair[]>([]);
  const [selectedPair, setSelectedPair] = useState<ExchangePair | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    syntaxType: 'TEXTE' | 'LIEN' | 'AUTRE';
    syntaxValue: string;
    totalAmount: number;
  } | null>(null);
  const [hasViewedSyntax, setHasViewedSyntax] = useState(false);
  const [lastShownAmount, setLastShownAmount] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransactionData, setSuccessTransactionData] = useState<{
    transactionId: string;
    amount: number;
    totalAmount: number;
    fromMethod: string;
    toMethod: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    from_number: '',
    to_number: '',
    amount: '',
    payment_reference: '',
    notes: '',
    dynamic_fields: {} as Record<string, any>
  });

  const [minAmount, setMinAmount] = useState(500);
  const [maxAmount, setMaxAmount] = useState(500000);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCheckingReference, setIsCheckingReference] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, initAuth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPairs();
      fetchTransactions();
      fetchSettings();
    }
  }, [isAuthenticated]);

  // Fonction pour passer à l'étape 2 et préparer les infos de paiement
  const goToStep2 = () => {
    if (!selectedPair) return;

    const total = calculateTotal();
    setPaymentInfo({
      syntaxType: selectedPair.payment_syntax_type || 'TEXTE',
      syntaxValue: selectedPair.payment_syntax_value,
      totalAmount: total
    });
    // Marquer automatiquement comme vu puisque l'utilisateur va voir la syntaxe à l'étape 2
    setHasViewedSyntax(true);
    setCurrentStep(2);
  };

  const fetchPairs = async () => {
    try {
      const response = await exchangePairsAPI.getAll(true);
      setPairs(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await transactionsAPI.getMyTransactions();
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSettings = async () => {
    try {
      const [minRes, maxRes] = await Promise.all([
        settingsAPI.getPublicConfig('min_amount'),
        settingsAPI.getPublicConfig('max_amount')
      ]);

      setMinAmount(parseFloat(minRes.data.config.value));
      setMaxAmount(parseFloat(maxRes.data.config.value));
    } catch (error) {
      console.error(error);
    }
  };

  const calculateTotal = () => {
    if (!selectedPair || !formData.amount) return 0;
    const amount = parseFloat(formData.amount);
    const fee = (amount * selectedPair.fee_percentage) / 100;
    const tax = selectedPair.tax_amount;
    return amount + fee + tax;
  };

  const handleViewSyntax = (skipValidation = false) => {
    if (!skipValidation && (!selectedPair || !formData.amount)) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!selectedPair || !formData.amount) return;

    const total = calculateTotal();
    setPaymentInfo({
      syntaxType: selectedPair.payment_syntax_type || 'TEXTE',
      syntaxValue: selectedPair.payment_syntax_value,
      totalAmount: total
    });
    setShowPaymentModal(true);
    setHasViewedSyntax(true);
  };

  const checkReferenceExists = async (reference: string) => {
    if (!reference || reference.trim() === '') {
      setReferenceError(null);
      return false;
    }

    setIsCheckingReference(true);
    setReferenceError(null);

    try {
      const response = await transactionsAPI.checkReference(reference.trim());
      if (response.data.exists) {
        setReferenceError('Cette référence a déjà été utilisée. Veuillez vérifier et entrer une référence valide.');
        return true;
      }
      setReferenceError(null);
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de la référence:', error);
      return false;
    } finally {
      setIsCheckingReference(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    // Utiliser les montants de la paire sélectionnée ou les valeurs par défaut
    const currentMinAmount = selectedPair?.min_amount || minAmount;
    const currentMaxAmount = selectedPair?.max_amount || maxAmount;

    if (amount < currentMinAmount || amount > currentMaxAmount) {
      toast.error(`Le montant doit être entre ${currentMinAmount} et ${currentMaxAmount} FCFA`);
      return;
    }

    // Vérifier si la syntaxe a été vue (sauf pour LIEN et si pas de syntaxe)
    const needsReference = selectedPair?.payment_syntax_type !== 'LIEN' &&
                          selectedPair?.payment_syntax_value &&
                          selectedPair?.payment_syntax_value.toLowerCase().indexOf('labab') === -1;

    if (needsReference && !hasViewedSyntax) {
      toast.error('Veuillez d\'abord consulter les instructions de paiement');
      return;
    }

    // Vérifier si la référence existe déjà (pour les transactions avec référence)
    const shouldCheckReference = selectedPair?.category !== 'subscription' || selectedPair?.reference_required !== false;
    if (needsReference && shouldCheckReference && formData.payment_reference && formData.payment_reference !== 'N/A') {
      const referenceExists = await checkReferenceExists(formData.payment_reference);
      if (referenceExists) {
        toast.error('Cette référence a déjà été utilisée. Veuillez vérifier et entrer une référence valide.');
        return;
      }
    }

    setLoading(true);

    try {
      // Déterminer le numéro de destination selon la catégorie
      const toNumber = selectedPair?.category === 'subscription' && selectedPair?.show_to_number === false
        ? formData.from_number
        : formData.to_number;

      // Déterminer la référence de paiement
      const paymentReference = (selectedPair?.category !== 'subscription' || selectedPair?.reference_required !== false) && formData.payment_reference
        ? formData.payment_reference
        : 'N/A';

      const response = await transactionsAPI.create({
        exchange_pair_id: selectedPair?.id,
        from_number: formData.from_number,
        to_number: toNumber,
        amount,
        payment_reference: paymentReference,
        notes: formData.notes || null,
        dynamic_fields: formData.dynamic_fields
      });

      // Préparer les données pour le modal de succès
      const transactionId = response.data.transaction?.transaction_id || 'N/A';
      setSuccessTransactionData({
        transactionId,
        amount,
        totalAmount: calculateTotal(),
        fromMethod: selectedPair?.from_method_name || '',
        toMethod: selectedPair?.to_method_name || ''
      });

      // Pour les liens, afficher d'abord le modal avec le lien, puis le modal de succès
      if (selectedPair?.payment_syntax_type === 'LIEN' && selectedPair?.payment_syntax_value) {
        setPaymentInfo({
          syntaxType: 'LIEN',
          syntaxValue: selectedPair.payment_syntax_value,
          totalAmount: calculateTotal()
        });
        setShowPaymentModal(true);
        // Le modal de succès sera affiché quand l'utilisateur ferme le modal de paiement
      } else {
        // Afficher le modal de succès directement pour les autres types
        setShowSuccessModal(true);
      }

      setSelectedPair(null);
      setHasViewedSyntax(false);
      setLastShownAmount(null);
      setCurrentStep(1);
      setFormData({
        from_number: '',
        to_number: '',
        amount: '',
        payment_reference: '',
        notes: '',
        dynamic_fields: {}
      });
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    // Rafraîchir les données utilisateur depuis le store
    await initAuth();
    toast.success('Profil mis à jour');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; icon: any; label: string }> = {
      pending: { class: 'badge-pending', icon: Clock, label: 'En attente' },
      validated: { class: 'badge-validated', icon: CheckCircle, label: 'Validée' },
      rejected: { class: 'badge-rejected', icon: XCircle, label: 'Rejetée' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`badge ${badge.class} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {/* Header EMILE TRANSFER+ avec logo */}
      <Header
        title="EMILE TRANSFER"
        subtitle="Effectuez vos échanges en toute sécurité"
        userName={user.name}
        isVerified={user.kyc_verified}
        onProfileClick={() => setShowProfileModal(true)}
        onLogout={() => {
          logout();
          router.push('/login');
        }}
      >
        <NotificationBell />
      </Header>

      <div className="min-h-screen p-3 sm:p-6 relative">
        {/* Grille de fond */}
        <div className="cyber-grid"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Welcome Message */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 sm:mb-8"
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">
                  Bienvenue, {user.name} 👋
                </h1>
                <p className="text-gray-400">Effectuez vos transactions en toute sécurité</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification Settings */}
          <div className="mb-6 sm:mb-8">
            <NotificationSettings />
          </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">
          <NeonButton
            variant={showHistory ? 'primary' : 'secondary'}
            onClick={() => {
              setShowHistory(!showHistory);
              setSelectedPair(null);
              setSelectedCategory(null);
              setHasViewedSyntax(false);
              setLastShownAmount(null);
              setCurrentStep(1);
            }}
            fullWidth
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{showHistory ? 'Nouvel échange' : 'Historique'}</span>
          </NeonButton>
        </div>

        <AnimatePresence mode="wait">
          {/* Sélection de la catégorie */}
          {!selectedPair && !showHistory && !selectedCategory && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                Choisissez une catégorie
              </h2>

              {(() => {
                const categories = {
                  money_exchange: { title: 'Échanges d\'argent', icon: '💰', pairs: [] as ExchangePair[], gradient: 'from-purple-600 to-purple-400' },
                  credit: { title: 'Crédits de communication', icon: '📱', pairs: [] as ExchangePair[], gradient: 'from-blue-600 to-blue-400' },
                  subscription: { title: 'Abonnements', icon: '📺', pairs: [] as ExchangePair[], gradient: 'from-pink-600 to-pink-400' },
                  purchase: { title: 'Achats', icon: '⚡', pairs: [] as ExchangePair[], gradient: 'from-yellow-600 to-yellow-400' },
                  bank_service: { title: 'Services bancaires', icon: '🏦', pairs: [] as ExchangePair[], gradient: 'from-green-600 to-green-400' },
                  other: { title: 'Autres services', icon: '📋', pairs: [] as ExchangePair[], gradient: 'from-gray-600 to-gray-400' }
                };

                // Grouper les paires par catégorie
                pairs.forEach(pair => {
                  const category = pair.category || 'other';
                  if (categories[category as keyof typeof categories]) {
                    categories[category as keyof typeof categories].pairs.push(pair);
                  } else {
                    categories.other.pairs.push(pair);
                  }
                });

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {Object.entries(categories).map(([key, { title, icon, pairs: categoryPairs, gradient }], index) => {
                      const isEmpty = categoryPairs.length === 0;

                      return (
                        <motion.div
                          key={key}
                          className={`card-emile p-6 sm:p-8 transition-all group relative overflow-hidden ${
                            isEmpty
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer hover:scale-105 active:scale-95'
                          }`}
                          onClick={() => !isEmpty && setSelectedCategory(key)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {/* Gradient background on hover */}
                          {!isEmpty && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                          )}

                          <div className="relative z-10">
                            <div className="text-6xl sm:text-7xl mb-4 text-center">
                              {icon}
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-center text-white mb-3">
                              {title}
                            </h3>

                            <div className="text-center">
                              {isEmpty ? (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700/20 text-gray-400 rounded-full text-sm font-semibold">
                                  <span>Bientôt disponible</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emile-red/20 text-emile-red rounded-full text-sm font-semibold">
                                  <span>{categoryPairs.length}</span>
                                  <span>service{categoryPairs.length > 1 ? 's' : ''}</span>
                                  <ArrowRight className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* Sélection de l'échange dans la catégorie */}
          {!selectedPair && !showHistory && selectedCategory && (
            <motion.div
              key="pairs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {(() => {
                const categoryTitles: Record<string, { title: string; icon: string }> = {
                  money_exchange: { title: 'Échanges d\'argent', icon: '💰' },
                  credit: { title: 'Crédits de communication', icon: '📱' },
                  subscription: { title: 'Abonnements', icon: '📺' },
                  purchase: { title: 'Achats', icon: '⚡' },
                  bank_service: { title: 'Services bancaires', icon: '🏦' },
                  other: { title: 'Autres services', icon: '📋' }
                };

                const categoryInfo = categoryTitles[selectedCategory] || { title: 'Services', icon: '📋' };
                const filteredPairs = pairs.filter(pair => (pair.category || 'other') === selectedCategory);

                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        <span>{categoryInfo.icon}</span>
                        <span>{categoryInfo.title}</span>
                        <span className="text-sm font-normal text-gray-400">({filteredPairs.length})</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                      {filteredPairs.map((pair, index) => (
                        <motion.div
                          key={pair.id}
                          className="card-emile p-4 sm:p-6 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                          onClick={() => {
                            setSelectedPair(pair);
                            setHasViewedSyntax(false);
                            setLastShownAmount(null);
                            setCurrentStep(1);
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <span className="text-4xl sm:text-5xl">{pair.from_method_icon}</span>
                            <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-emile-red animate-pulse" />
                            <span className="text-4xl sm:text-5xl">{pair.to_method_icon}</span>
                          </div>

                          <h3 className="text-lg sm:text-xl font-semibold text-center text-white mb-3 sm:mb-4">
                            {pair.from_method_name} → {pair.to_method_name}
                          </h3>

                          <div className="space-y-1 sm:space-y-2 text-center">
                            <div className="text-xs sm:text-sm text-gray-300">
                              Frais: <span className="text-emile-red font-bold">{pair.fee_percentage}%</span>
                            </div>
                            {pair.tax_amount > 0 && (
                              <div className="text-xs sm:text-sm text-gray-300">
                                Taxe: <span className="text-emile-red font-bold">{pair.tax_amount} FCFA</span>
                              </div>
                            )}
                            <div className="text-xs sm:text-sm text-gray-300">
                              Montants: <span className="text-emile-green font-bold">{pair.min_amount || 500} - {pair.max_amount || 500000} FCFA</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* Exchange Form */}
          {selectedPair && !showHistory && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="card-emile max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-3xl sm:text-4xl">{selectedPair.from_method_icon}</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-emile-red" />
                    <span className="text-3xl sm:text-4xl">{selectedPair.to_method_icon}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPair(null);
                      setSelectedCategory(null);
                      setHasViewedSyntax(false);
                      setLastShownAmount(null);
                      setCurrentStep(1);
                    }}
                    className="text-gray-400 hover:text-white text-xl sm:text-2xl p-2 -m-2"
                  >
                    ✕
                  </button>
                </div>

                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-emile-red mb-4 sm:mb-6">
                  {selectedPair.from_method_name} → {selectedPair.to_method_name}
                </h2>

                {/* Instructions pour le client */}
                {selectedPair.instruction_title && selectedPair.instruction_content && (
                  <div className="mb-6 p-4 sm:p-5 bg-blue-900/20 border-2 border-blue-500/30 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-blue-300 mb-2">
                          📋 {selectedPair.instruction_title}
                        </h3>
                        <div className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {selectedPair.instruction_content}
                        </div>
                        {selectedPair.instruction_link_url && selectedPair.instruction_link_text && (
                          <a
                            href={selectedPair.instruction_link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm"
                          >
                            <span>{selectedPair.instruction_link_text}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Indicateur d'étapes */}
                <div className="flex items-center justify-center mb-6 gap-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'} font-bold text-sm`}>
                    1
                  </div>
                  <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-red-500' : 'bg-gray-700'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'} font-bold text-sm`}>
                    2
                  </div>
                </div>

                <form onSubmit={currentStep === 1 ? (e) => { e.preventDefault(); goToStep2(); } : handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* ÉTAPE 1: Informations de base */}
                  {currentStep === 1 && (
                    <>
                      <AnimatedInput
                        label={
                          selectedPair.category === 'subscription' && selectedPair.from_number_label
                            ? selectedPair.from_number_label
                            : `Numéro ${selectedPair.from_method_name} (source)`
                        }
                        type="tel"
                        placeholder={
                          selectedPair.category === 'subscription' && selectedPair.from_number_placeholder
                            ? selectedPair.from_number_placeholder
                            : `Ex: 90123456`
                        }
                        value={formData.from_number}
                        onChange={(e) => setFormData({ ...formData, from_number: e.target.value })}
                        required
                      />

                      {(selectedPair.category !== 'subscription' || selectedPair.show_to_number !== false) && (
                        <AnimatedInput
                          label={
                            selectedPair.category === 'subscription' && selectedPair.to_number_label
                              ? selectedPair.to_number_label
                              : `Numéro ${selectedPair.to_method_name} (destination)`
                          }
                          type="tel"
                          placeholder={
                            selectedPair.category === 'subscription' && selectedPair.to_number_placeholder
                              ? selectedPair.to_number_placeholder
                              : `Ex: 70123456`
                          }
                          value={formData.to_number}
                          onChange={(e) => setFormData({ ...formData, to_number: e.target.value })}
                          required
                        />
                      )}

                      <AnimatedInput
                        label={
                          selectedPair.category === 'subscription' && selectedPair.amount_label
                            ? selectedPair.amount_label
                            : "Montant"
                        }
                        type="number"
                        step="1"
                        min={selectedPair?.min_amount || minAmount}
                        max={selectedPair?.max_amount || maxAmount}
                        placeholder={
                          selectedPair.category === 'subscription' && selectedPair.amount_placeholder
                            ? selectedPair.amount_placeholder
                            : `Entre ${selectedPair?.min_amount || minAmount} et ${selectedPair?.max_amount || maxAmount} FCFA`
                        }
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        suffix="FCFA"
                      />

                      {/* Dynamic Fields */}
                      {selectedPair.fields?.map((field) => {
                    if (field.field_type === 'select' && field.options) {
                      const options = typeof field.options === 'string'
                        ? JSON.parse(field.options)
                        : field.options;

                      return (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            {field.field_label}
                            {field.is_required && <span className="text-red-400 ml-1">*</span>}
                          </label>
                          <select
                            className="form-input"
                            required={field.is_required}
                            value={formData.dynamic_fields[field.field_name] || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                dynamic_fields: {
                                  ...formData.dynamic_fields,
                                  [field.field_name]: e.target.value
                                }
                              })
                            }
                          >
                            <option value="">Sélectionner...</option>
                            {options.map((opt: string, i: number) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    return (
                      <AnimatedInput
                        key={field.id}
                        label={field.field_label}
                        type={field.field_type === 'file' ? 'text' : field.field_type}
                        placeholder={field.placeholder}
                        required={field.is_required}
                        value={formData.dynamic_fields[field.field_name] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dynamic_fields: {
                              ...formData.dynamic_fields,
                              [field.field_name]: e.target.value
                            }
                          })
                        }
                      />
                    );
                  })}

                      <button type="submit" className="btn-emile-primary w-full">
                        <span className="text-sm sm:text-base">Continuer →</span>
                      </button>
                    </>
                  )}

                  {/* ÉTAPE 2: Syntaxe de paiement et confirmation */}
                  {currentStep === 2 && paymentInfo && (
                    <>
                      {/* Affichage de la syntaxe inline */}
                      {paymentInfo.syntaxType === 'TEXTE' && paymentInfo.syntaxValue && paymentInfo.syntaxValue.toLowerCase().indexOf('labab') === -1 && (
                        <div className="bg-gray-900/50 border-2 border-red-500/30 rounded-xl p-4 sm:p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 sm:p-3 bg-red-500/20 rounded-lg">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">Instructions de Paiement</h3>
                                <p className="text-gray-400 text-xs sm:text-sm">Veuillez suivre ces instructions</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(paymentInfo.syntaxValue.replace(/{montant}/g, paymentInfo.totalAmount.toString()));
                                  toast.success('Syntaxe copiée!');
                                } catch (error) {
                                  toast.error('Erreur lors de la copie');
                                }
                              }}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                              title="Copier la syntaxe"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>

                          <div className="bg-black/30 rounded-lg p-3 sm:p-4 border border-red-500/20">
                            <p className="text-white text-base sm:text-lg font-mono leading-relaxed whitespace-pre-wrap">
                              {paymentInfo.syntaxValue.replace(/{montant}/g, paymentInfo.totalAmount.toString())}
                            </p>
                          </div>

                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                            <p className="text-yellow-400 text-xs sm:text-sm">
                              <span className="font-semibold">Montant à payer:</span> <span className="font-bold text-base sm:text-lg">{paymentInfo.totalAmount} FCFA</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Lien de paiement cliquable */}
                      {paymentInfo.syntaxType === 'LIEN' && paymentInfo.syntaxValue && (
                        <div className="bg-gray-900/50 border-2 border-blue-500/30 rounded-xl p-4 sm:p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">Lien de Paiement</h3>
                                <p className="text-gray-400 text-xs sm:text-sm">Cliquez pour effectuer le paiement</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(paymentInfo.syntaxValue);
                                  toast.success('Lien copié!');
                                } catch (error) {
                                  toast.error('Erreur lors de la copie');
                                }
                              }}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                              title="Copier le lien"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>

                          <a
                            href={paymentInfo.syntaxValue}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block"
                          >
                            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 sm:p-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                              <div className="flex items-center justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-semibold mb-1 text-sm sm:text-base">Ouvrir le lien de paiement</div>
                                  <div className="text-blue-100 text-xs sm:text-sm truncate">{paymentInfo.syntaxValue}</div>
                                </div>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                            </div>
                          </a>

                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
                            <p className="text-yellow-400 text-xs sm:text-sm">
                              <span className="font-semibold">Montant à payer:</span> <span className="font-bold text-base sm:text-lg">{paymentInfo.totalAmount} FCFA</span>
                            </p>
                          </div>

                          <div className="text-gray-400 text-xs sm:text-sm">
                            Le lien s'ouvrira dans un nouvel onglet. Une fois le paiement effectué, votre transaction sera automatiquement validée par un administrateur.
                          </div>
                        </div>
                      )}

                      {/* Message pour Labab */}
                      {selectedPair.payment_syntax_value && selectedPair.payment_syntax_value.toLowerCase().indexOf('labab') !== -1 && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <p className="text-sm text-purple-400">
                            ℹ️ Pas de référence requise pour ce type de transaction.
                          </p>
                        </div>
                      )}

                      {/* Champ référence de paiement */}
                      {(selectedPair.category !== 'subscription' || selectedPair.reference_required !== false) &&
                       selectedPair.payment_syntax_type !== 'LIEN' &&
                       (!selectedPair.payment_syntax_value || selectedPair.payment_syntax_value.toLowerCase().indexOf('labab') === -1) && (
                        <div>
                          <AnimatedInput
                            label={
                              selectedPair.category === 'subscription' && selectedPair.reference_label
                                ? selectedPair.reference_label
                                : "Référence de paiement"
                            }
                            placeholder={
                              selectedPair.category === 'subscription' && selectedPair.reference_placeholder
                                ? selectedPair.reference_placeholder
                                : "Ex: TM123456789"
                            }
                            value={formData.payment_reference}
                            onChange={(e) => {
                              setFormData({ ...formData, payment_reference: e.target.value });
                              setReferenceError(null);
                            }}
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                checkReferenceExists(e.target.value.trim());
                              }
                            }}
                            required
                          />
                          {isCheckingReference && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Vérification de la référence...
                            </div>
                          )}
                          {referenceError && (
                            <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg flex items-start gap-2">
                              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p className="text-sm text-yellow-400">{referenceError}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <AnimatedInput
                        label="Notes (optionnel)"
                        placeholder="Informations supplémentaires..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          ← Retour
                        </button>
                        <button type="submit" className="flex-[2] btn-emile-primary" disabled={loading}>
                          <span className="text-sm sm:text-base">{loading ? 'En cours...' : 'Confirmer l\'échange'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </motion.div>
          )}

          {/* Transaction History */}
          {showHistory && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Historique des transactions</h2>
                <button
                  onClick={fetchTransactions}
                  className="btn-emile-secondary flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {transactions.length === 0 ? (
                  <div className="card-emile p-6 sm:p-8 text-center">
                    <p className="text-sm sm:text-base text-gray-300">Aucune transaction pour le moment</p>
                  </div>
                ) : (
                  transactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      className="card-emile p-4 sm:p-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">
                              {tx.transaction_id}
                            </h3>
                            {getStatusBadge(tx.status)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">
                            {new Date(tx.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-emile-red whitespace-nowrap">
                            {tx.total_amount} F
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
                            {tx.amount} FCFA
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Modal Syntaxe de Paiement */}
      {paymentInfo && (
        <PaymentSyntaxModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentInfo(null);
            setHasViewedSyntax(true); // Marquer comme vu quand l'utilisateur ferme la modale
            // Si on a des données de transaction (transaction créée), afficher le modal de succès
            if (successTransactionData) {
              setShowSuccessModal(true);
            }
          }}
          syntaxType={paymentInfo.syntaxType}
          syntaxValue={paymentInfo.syntaxValue}
          totalAmount={paymentInfo.totalAmount}
        />
      )}

      {/* Modal de Succès */}
      {successTransactionData && (
        <TransactionSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessTransactionData(null);
          }}
          transactionId={successTransactionData.transactionId}
          amount={successTransactionData.amount}
          totalAmount={successTransactionData.totalAmount}
          fromMethod={successTransactionData.fromMethod}
          toMethod={successTransactionData.toMethod}
        />
      )}

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={{
            id: user.id,
            name: user.name,
            email: user.email || '',
            phone: user.phone,
            kyc_verified: Boolean(user.kyc_verified),
            kyc_status: (user.kyc_status as 'pending' | 'approved' | 'rejected') || 'pending'
          }}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {/* Chat Widget */}
      <ChatWidget />

      {/* Activation automatique des notifications push */}
      <AutoPushNotifications />
    </>
  );
}
