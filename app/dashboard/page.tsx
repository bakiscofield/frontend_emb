'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { transactionsAPI, settingsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  ArrowRightLeft, 
  LogOut, 
  History, 
  Plus, 
  DollarSign,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface Transaction {
  id: number;
  transaction_id: string;
  amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  tmoney_number: string;
  flooz_number: string;
}

interface Bookmaker {
  id: number;
  name: string;
  code: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, initAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    tmoney_number: '',
    flooz_number: '',
    amount: '',
    payment_reference: '',
    bookmaker_id: '',
    notes: '',
  });

  useEffect(() => {
    initAuth();
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [transRes, bookRes, percentRes] = await Promise.all([
        transactionsAPI.getMyTransactions(),
        settingsAPI.getBookmakers(true),
        settingsAPI.getPublicConfig('commission_percentage')
      ]);

      setTransactions(transRes.data.transactions);
      setBookmakers(bookRes.data.bookmakers);
      setPercentage(parseFloat(percentRes.data.config.value));
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const commission = (amount * percentage) / 100;
    return amount + commission;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await transactionsAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
        bookmaker_id: formData.bookmaker_id ? parseInt(formData.bookmaker_id) : null,
      });

      toast.success('Transaction créée avec succès !');
      setFormData({
        tmoney_number: '',
        flooz_number: '',
        amount: '',
        payment_reference: '',
        bookmaker_id: '',
        notes: '',
      });
      loadData();
      setActiveTab('history');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
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

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EMB</h1>
              <p className="text-sm text-gray-600">Bienvenue, {user.name}</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Nouvelle transaction
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-5 h-5 inline mr-2" />
            Historique
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'new' ? (
          <div className="max-w-2xl mx-auto">
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <ArrowRightLeft className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Nouvelle transaction</h2>
                  <p className="text-sm text-gray-600">Échange Tmoney vers Flooz</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Numéro Tmoney (source)
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+228 XX XX XX XX"
                      value={formData.tmoney_number}
                      onChange={(e) => setFormData({ ...formData, tmoney_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Numéro Flooz (destination)
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+228 XX XX XX XX"
                      value={formData.flooz_number}
                      onChange={(e) => setFormData({ ...formData, flooz_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Montant (FCFA)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Montant à échanger"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="1"
                  />
                  {formData.amount && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Commission ({percentage}%): <span className="font-medium">{((parseFloat(formData.amount) * percentage) / 100).toFixed(0)} FCFA</span>
                      </div>
                      <div className="text-lg font-bold text-primary-600 mt-1">
                        Total à payer: {calculateTotal().toFixed(0)} FCFA
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Référence de paiement
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Référence de votre paiement Tmoney"
                    value={formData.payment_reference}
                    onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Effectuez d'abord le paiement Tmoney, puis entrez la référence ici
                  </p>
                </div>

                <div>
                  <label className="form-label">Bookmaker (optionnel)</label>
                  <select
                    className="form-input"
                    value={formData.bookmaker_id}
                    onChange={(e) => setFormData({ ...formData, bookmaker_id: e.target.value })}
                  >
                    <option value="">Sélectionnez un bookmaker</option>
                    {bookmakers.map((bm) => (
                      <option key={bm.id} value={bm.id}>
                        {bm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Notes (optionnel)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Informations supplémentaires..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Envoi...' : 'Soumettre la transaction'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Mes transactions</h2>
            {transactions.length === 0 ? (
              <div className="card text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune transaction pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {transaction.transaction_id}
                          </span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>Tmoney: {transaction.tmoney_number}</div>
                          <div>Flooz: {transaction.flooz_number}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(transaction.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {transaction.amount.toFixed(0)} FCFA
                        </div>
                        <div className="text-sm text-gray-600">
                          Total: {transaction.total_amount.toFixed(0)} FCFA
                        </div>
                      </div>
                    </div>
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
