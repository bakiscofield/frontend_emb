'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { transactionsAPI, settingsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Settings,
  History,
  Eye
} from 'lucide-react';

interface Transaction {
  id: number;
  transaction_id: string;
  user_name: string;
  user_phone: string;
  tmoney_number: string;
  flooz_number: string;
  amount: number;
  percentage: number;
  total_amount: number;
  payment_reference: string;
  status: string;
  bookmaker_name?: string;
  notes?: string;
  created_at: string;
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
  const [percentage, setPercentage] = useState('');
  const [loading, setLoading] = useState(false);

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
      } else if (activeTab === 'settings') {
        const configRes = await settingsAPI.getPublicConfig('commission_percentage');
        setPercentage(configRes.data.config.value);
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

  const handleUpdatePercentage = async () => {
    setLoading(true);
    try {
      await settingsAPI.updateConfig('commission_percentage', percentage);
      toast.success('Pourcentage mis à jour avec succès');
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Administration EMB</h1>
                <p className="text-sm text-gray-300">{admin.username}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logoutAdmin();
                router.push('/admin/login');
              }}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              En attente
            </button>
            <button
              onClick={() => setActiveTab('validated')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'validated'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Validées
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <XCircle className="w-4 h-4 inline mr-2" />
              Rejetées
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-gray-700 text-gray-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Paramètres
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stats' && stats ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total transactions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_transactions}</p>
                </div>
                <History className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending_transactions}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-400" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Validées</p>
                  <p className="text-3xl font-bold text-green-600">{stats.validated_transactions}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejetées</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected_transactions}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Montant total validé</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_amount_validated.toFixed(0)} FCFA
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commission totale</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {stats.total_commission.toFixed(0)} FCFA
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-primary-400" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilisateurs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                </div>
                <Users className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Paramètres de commission</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Pourcentage de commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleUpdatePercentage}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Transactions {activeTab === 'pending' ? 'en attente' : activeTab === 'validated' ? 'validées' : 'rejetées'}
            </h2>
            {transactions.length === 0 ? (
              <div className="card text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune transaction dans cette catégorie</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {transaction.transaction_id}
                          </span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Client:</strong> {transaction.user_name} ({transaction.user_phone})</div>
                          <div><strong>Tmoney:</strong> {transaction.tmoney_number}</div>
                          <div><strong>Flooz:</strong> {transaction.flooz_number}</div>
                          <div><strong>Référence:</strong> {transaction.payment_reference}</div>
                          {transaction.bookmaker_name && (
                            <div><strong>Bookmaker:</strong> {transaction.bookmaker_name}</div>
                          )}
                          {transaction.notes && (
                            <div><strong>Notes:</strong> {transaction.notes}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(transaction.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-gray-900">
                          {transaction.amount.toFixed(0)} FCFA
                        </div>
                        <div className="text-sm text-gray-600">
                          Commission: {((transaction.total_amount - transaction.amount)).toFixed(0)} FCFA
                        </div>
                        <div className="text-sm font-medium text-primary-600">
                          Total: {transaction.total_amount.toFixed(0)} FCFA
                        </div>
                      </div>
                    </div>

                    {activeTab === 'pending' && (
                      <div className="border-t pt-4 mt-4 space-y-3">
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Commentaire (optionnel)..."
                          value={selectedTransaction?.id === transaction.id ? validationComment : ''}
                          onChange={(e) => {
                            setSelectedTransaction(transaction);
                            setValidationComment(e.target.value);
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleValidation(transaction.id, 'validated')}
                            className="btn-success flex-1"
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Valider
                          </button>
                          <button
                            onClick={() => handleValidation(transaction.id, 'rejected')}
                            className="btn-danger flex-1"
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
  );
}
