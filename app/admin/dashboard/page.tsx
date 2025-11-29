'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { transactionsAPI, settingsAPI } from '@/lib/api';
import Header from '@/components/Header';
import NotificationBell from '@/components/NotificationBell';
import TransactionPDFModal from '@/components/TransactionPDFModal';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Settings,
  History,
  UserCog,
  Mail,
  Printer,
  Search
} from 'lucide-react';

interface Transaction {
  id: number;
  transaction_id: string;
  user_name: string;
  user_phone: string;
  user_email?: string;
  tmoney_number?: string;
  flooz_number?: string;
  from_number?: string;
  to_number?: string;
  exchange_pair_id?: number;
  exchange_pair_name?: string;
  amount: number;
  percentage: number;
  total_amount: number;
  payment_reference: string;
  status: string;
  bookmaker_name?: string;
  notes?: string;
  created_at: string;
  validated_at?: string;
}

interface Stats {
  total_transactions: number;
  pending_transactions: number;
  validated_transactions: number;
  rejected_transactions: number;
  total_amount_validated: number;
  total_commission: number;
  total_users: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin, initAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'validated' | 'rejected' | 'stats' | 'settings'>('pending');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfTransaction, setPdfTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initAuth();
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isAdmin, router, initAuth]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadData();
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'stats') {
        const statsRes = await transactionsAPI.getStats();
        setStats(statsRes.data.stats);
      } else {
        const transRes = await transactionsAPI.getAllTransactions({ status: activeTab, limit: 100 });
        setTransactions(transRes.data.transactions);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleValidation = async (transactionId: number, status: 'validated' | 'rejected') => {
    setLoading(true);
    try {
      await transactionsAPI.validateTransaction(transactionId.toString(), {
        status,
        comment: validationComment
      });

      toast.success(`Transaction ${status === 'validated' ? 'validée' : 'rejetée'} avec succès`);
      setSelectedTransaction(null);
      setValidationComment('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending"><Clock className="w-3 h-3 mr-1" />En attente</span>;
      case 'validated':
        return <span className="badge badge-validated"><CheckCircle className="w-3 h-3 mr-1" />Validé</span>;
      case 'rejected':
        return <span className="badge badge-rejected"><XCircle className="w-3 h-3 mr-1" />Rejeté</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (!isAuthenticated || !isAdmin || !admin) {
    return null;
  }

  return (
    <>
      {/* Header EMILE TRANSFER+ avec logo */}
      <Header
        title="EMILE TRANSFER"
        subtitle="Panneau d'administration"
        userName={admin.username}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
      >
        <NotificationBell />
      </Header>

      <div className="min-h-screen relative">
        {/* Grille de fond */}
        <div className="cyber-grid"></div>

      {/* Tabs */}
      <div className="relative z-10 bg-gray-900/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">En attente</span>
              <span className="sm:hidden">Attente</span>
            </button>
            <button
              onClick={() => setActiveTab('validated')}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'validated'
                  ? 'border-emile-green text-emile-green'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Validées
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'border-emile-red text-emile-red'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Rejetées
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Statistiques</span>
              <span className="sm:hidden">Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-gray-400 text-gray-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Paramètres</span>
              <span className="sm:hidden">Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8">
        {activeTab === 'stats' && stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="card-emile">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total transactions</p>
                  <p className="text-3xl font-bold text-white">{stats.total_transactions}</p>
                </div>
                <History className="w-12 h-12 text-gray-500" />
              </div>
            </div>
            <div className="card-emile">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">En attente</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pending_transactions}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
            <div className="card-emile">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Validées</p>
                  <p className="text-3xl font-bold text-emile-green">{stats.validated_transactions}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-emile-green" />
              </div>
            </div>
            <div className="card-emile">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Rejetées</p>
                  <p className="text-3xl font-bold text-emile-red">{stats.rejected_transactions}</p>
                </div>
                <XCircle className="w-12 h-12 text-emile-red" />
              </div>
            </div>
            <div className="card-emile">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Montant total validé</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.total_amount_validated.toFixed(0)} FCFA
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-gray-500" />
              </div>
            </div>
            <div className="card-emile">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Commission totale</p>
                  <p className="text-2xl font-bold text-emile-green">
                    {stats.total_commission.toFixed(0)} FCFA
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-emile-green" />
              </div>
            </div>
            <div className="card-emile">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Utilisateurs</p>
                  <p className="text-3xl font-bold text-white">{stats.total_users}</p>
                </div>
                <Users className="w-12 h-12 text-gray-500" />
              </div>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="space-y-6">
            {/* Configuration rapide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => router.push('/admin/payment-methods')}
                className="card-emile cursor-pointer hover:border-emile-green/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emile-green/20 rounded-lg flex items-center justify-center group-hover:bg-emile-green/30 transition-colors">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emile-green transition-colors">Moyens de paiement</h3>
                    <p className="text-sm text-gray-400">Gérer les chaînes de paiement</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => router.push('/admin/exchange-pairs')}
                className="card-emile cursor-pointer hover:border-emile-red/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emile-red/20 rounded-lg flex items-center justify-center group-hover:bg-emile-red/30 transition-colors">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emile-red transition-colors">Paires d'échanges</h3>
                    <p className="text-sm text-gray-400">Configurer les conversions</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-white">
                Transactions {activeTab === 'pending' ? 'en attente' : activeTab === 'validated' ? 'validées' : 'rejetées'}
              </h2>
              <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro de transaction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-emile pl-10 w-full"
                />
              </div>
            </div>
            {transactions.filter(transaction =>
              transaction.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="card-emile text-center py-12">
                <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchQuery ? `Aucune transaction trouvée pour "${searchQuery}"` : 'Aucune transaction dans cette catégorie'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.filter(transaction =>
                  transaction.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`card-emile hover:border-emile-green/30 transition-all cursor-pointer ${
                      selectedTransaction?.id === transaction.id ? 'border-emile-green/50' : ''
                    }`}
                    onClick={() => {
                      if (activeTab === 'pending') {
                        setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction);
                        if (selectedTransaction?.id !== transaction.id) {
                          setValidationComment('');
                        }
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-medium text-white">
                            {transaction.transaction_id}
                          </span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                          <div><strong className="text-white">Client:</strong> {transaction.user_name} ({transaction.user_phone})</div>
                          {transaction.exchange_pair_id ? (
                            <>
                              <div><strong className="text-white">Source:</strong> {transaction.from_number}</div>
                              <div><strong className="text-white">Destination:</strong> {transaction.to_number}</div>
                            </>
                          ) : (
                            <>
                              <div><strong className="text-white">Tmoney:</strong> {transaction.tmoney_number}</div>
                              <div><strong className="text-white">Flooz:</strong> {transaction.flooz_number}</div>
                            </>
                          )}
                          <div><strong className="text-white">Référence:</strong> {transaction.payment_reference}</div>
                          {transaction.bookmaker_name && (
                            <div><strong className="text-white">Bookmaker:</strong> {transaction.bookmaker_name}</div>
                          )}
                          {transaction.notes && (
                            <div><strong className="text-white">Notes:</strong> {transaction.notes}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(transaction.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfTransaction(transaction);
                              setShowPDFModal(true);
                            }}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            title="Imprimer le reçu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-lg font-bold text-white">
                          {transaction.amount.toFixed(0)} FCFA
                        </div>
                        <div className="text-sm text-gray-400">
                          Commission: {((transaction.total_amount - transaction.amount)).toFixed(0)} FCFA
                        </div>
                        <div className="text-sm font-medium text-emile-green">
                          Total: {transaction.total_amount.toFixed(0)} FCFA
                        </div>
                      </div>
                    </div>

                    {activeTab === 'pending' && selectedTransaction?.id === transaction.id && (
                      <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                        <textarea
                          className="input-emile"
                          rows={2}
                          placeholder="Commentaire (optionnel)..."
                          value={validationComment}
                          onChange={(e) => {
                            e.stopPropagation();
                            setValidationComment(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidation(transaction.id, 'validated');
                            }}
                            className="btn-emile-success flex-1"
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Valider
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidation(transaction.id, 'rejected');
                            }}
                            className="btn-emile-danger flex-1"
                            disabled={loading}
                          >
                            <XCircle className="w-4 h-4 inline mr-2" />
                            Rejeter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* PDF Modal */}
      {showPDFModal && pdfTransaction && (
        <TransactionPDFModal
          transaction={pdfTransaction}
          onClose={() => {
            setShowPDFModal(false);
            setPdfTransaction(null);
          }}
        />
      )}
    </>
  );
}
