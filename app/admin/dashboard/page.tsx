'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { transactionsAPI, settingsAPI, commissionAPI } from '@/lib/api';
import Header from '@/components/Header';
import NotificationBell from '@/components/NotificationBell';
import NotificationSettings from '@/components/NotificationSettings';
import TransactionPDFModal from '@/components/TransactionPDFModal';
import toast from 'react-hot-toast';
import AssignmentTimer from '@/components/AssignmentTimer';
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
  Search,
  UserCheck,
  MapPin,
  RotateCcw,
  Filter,
  Calendar,
  BarChart3,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  Wallet
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
  exchange_pair_category?: string;
  amount: number;
  percentage: number;
  total_amount: number;
  payment_reference: string;
  status: string;
  bookmaker_name?: string;
  notes?: string;
  admin_message?: string;
  created_at: string;
  validated_at?: string;
  assigned_to?: number;
  assigned_admin_name?: string;
  point_de_vente_name?: string;
  point_de_vente_address?: string;
  assignment_expires_at?: string;
  dynamic_fields?: Record<string, any> | null;
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

interface AdminStat {
  admin_id: number;
  admin_name: string;
  validated: number;
  rejected: number;
  total_amount: number;
  commission: number;
}

interface StatsTransaction {
  id: number;
  transaction_id: string;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  amount: number;
  percentage: number;
  total_amount: number;
  status: string;
  created_at: string;
  validated_at: string | null;
  validated_by_name: string | null;
  assigned_admin_name: string | null;
  point_de_vente_name: string | null;
  point_de_vente_address: string | null;
  exchange_pair_name: string | null;
  exchange_pair_category: string | null;
  payment_reference: string;
  from_number: string | null;
  to_number: string | null;
  bookmaker_name: string | null;
  notes: string | null;
  admin_message: string | null;
  dynamic_fields?: Record<string, any> | null;
}

interface AdminOption {
  id: number;
  username: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin, initAuth, hasPermission, hasAnyPermission } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'assigned' | 'pending' | 'validated' | 'rejected' | 'stats' | 'settings'>('assigned');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfTransaction, setPdfTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats détaillées
  const [statsDateFrom, setStatsDateFrom] = useState('');
  const [statsDateTo, setStatsDateTo] = useState('');
  const [statsAdminFilter, setStatsAdminFilter] = useState('');
  const [adminStats, setAdminStats] = useState<AdminStat[]>([]);
  const [statsTransactions, setStatsTransactions] = useState<StatsTransaction[]>([]);
  const [statsAdminOptions, setStatsAdminOptions] = useState<AdminOption[]>([]);
  const [detailedStats, setDetailedStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [expandedStatsTransaction, setExpandedStatsTransaction] = useState<number | null>(null);
  const [commissionBalance, setCommissionBalance] = useState<number>(0);

  useEffect(() => {
    initAuth();
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
      return;
    }
    if (!hasAnyPermission('VIEW_TRANSACTIONS', 'VALIDATE_TRANSACTIONS')) {
      toast.error('Vous n\'avez pas la permission d\'accéder à cette page');
      router.push('/admin/chat');
    }
  }, [isAuthenticated, isAdmin, router, initAuth]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadData();
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      commissionAPI.getBalance()
        .then(res => setCommissionBalance(res.data.balance || 0))
        .catch(() => {});
    }
  }, [isAuthenticated, isAdmin]);

  const loadDetailedStats = async () => {
    setStatsLoading(true);
    try {
      const params: any = {};
      if (statsDateFrom) params.date_from = statsDateFrom;
      if (statsDateTo) params.date_to = statsDateTo;
      if (statsAdminFilter) params.admin_id = statsAdminFilter;

      const res = await transactionsAPI.getDetailedStats(params);
      setDetailedStats(res.data.stats);
      setAdminStats(res.data.admin_stats || []);
      setStatsTransactions(res.data.transactions || []);
      setStatsAdminOptions(res.data.admins || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      if (activeTab === 'stats') {
        await loadDetailedStats();
      } else if (activeTab === 'assigned') {
        const transRes = await transactionsAPI.getMyAssignedTransactions({ limit: 100 });
        setTransactions(transRes.data.transactions);
      } else if (activeTab === 'pending') {
        // En attente = transactions acceptées par cet admin, prêtes à traiter
        const transRes = await transactionsAPI.getMyAcceptedTransactions({ limit: 100 });
        setTransactions(transRes.data.transactions);
      } else {
        const transRes = await transactionsAPI.getAllTransactions({ status: activeTab, limit: 100 });
        setTransactions(transRes.data.transactions);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleAcceptAssignment = async (transactionId: number) => {
    setLoading(true);
    try {
      await transactionsAPI.acceptAssignment(transactionId.toString());
      toast.success('Assignation acceptée ! La transaction est maintenant dans "En attente".');
      setSelectedTransaction(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'acceptation');
    } finally {
      setLoading(false);
    }
  };

  const handleRefuseAssignment = async (transactionId: number) => {
    setLoading(true);
    try {
      await transactionsAPI.refuseTransaction(transactionId.toString());
      toast.success('Transaction refusée et réassignée');
      setSelectedTransaction(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (transactionId: number, status: 'validated' | 'rejected') => {
    // Vérifier si c'est un abonnement et si le message est requis
    const isSubscription = selectedTransaction?.exchange_pair_category === 'subscription';
    if (status === 'validated' && isSubscription && !adminMessage.trim()) {
      toast.error('Le message est requis pour valider un abonnement');
      return;
    }

    setLoading(true);
    try {
      await transactionsAPI.validateTransaction(transactionId.toString(), {
        status,
        comment: validationComment,
        admin_message: adminMessage.trim() || undefined
      });

      toast.success(`Transaction ${status === 'validated' ? 'validée' : 'rejetée'} avec succès`);
      setSelectedTransaction(null);
      setValidationComment('');
      setAdminMessage('');
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
        adminPermissions={admin.permissions || []}
      >
        <NotificationBell />
      </Header>

      <div className="min-h-screen relative">
        {/* Grille de fond */}
        <div className="cyber-grid"></div>

      {/* Bandeau solde commission - visible uniquement pour les agents */}
      {admin?.role !== 'admin' && (
      <div className="relative z-10 bg-gradient-to-r from-emerald-600 to-emerald-500 border-b border-emerald-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3">
          <button
            onClick={() => router.push('/admin/commissions')}
            className="flex items-center gap-3 w-full text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-100 text-xs">Mon solde commissions</p>
              <p className="text-white font-bold text-lg">{commissionBalance.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <span className="text-emerald-200 text-sm group-hover:text-white transition-colors">
              Voir détails →
            </span>
          </button>
        </div>
      </div>
      )}

      {/* Tabs */}
      <div className="relative z-10 bg-gray-900/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'assigned'
                  ? 'border-teal-500 text-teal-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Mes assignations</span>
              <span className="sm:hidden">Assignées</span>
            </button>
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
            {hasPermission('VIEW_TRANSACTION_STATS') && (
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
            )}
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
        {activeTab === 'stats' ? (
          <div className="space-y-6">
            {/* Filtres */}
            <div className="card-emile">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Filtres</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date début</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={statsDateFrom}
                      onChange={(e) => setStatsDateFrom(e.target.value)}
                      className="input-emile pl-10 w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date fin</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={statsDateTo}
                      onChange={(e) => setStatsDateTo(e.target.value)}
                      className="input-emile pl-10 w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Admin</label>
                  <select
                    value={statsAdminFilter}
                    onChange={(e) => setStatsAdminFilter(e.target.value)}
                    className="input-emile w-full [&>option]:bg-gray-900 [&>option]:text-white"
                  >
                    <option value="" className="bg-gray-900 text-white">Tous les admins</option>
                    {statsAdminOptions.map((a) => (
                      <option key={a.id} value={a.id} className="bg-gray-900 text-white">{a.username}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={loadDetailedStats}
                    disabled={statsLoading}
                    className="btn-emile-primary w-full"
                  >
                    {statsLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Chargement...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" />
                        Rechercher
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Cartes statistiques */}
            {detailedStats && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="card-emile">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total transactions</p>
                      <p className="text-3xl font-bold text-white">{detailedStats.total_transactions}</p>
                    </div>
                    <History className="w-10 h-10 text-gray-500" />
                  </div>
                </div>
                <div className="card-emile">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">En attente</p>
                      <p className="text-3xl font-bold text-yellow-400">{detailedStats.pending_transactions}</p>
                    </div>
                    <Clock className="w-10 h-10 text-yellow-500" />
                  </div>
                </div>
                <div className="card-emile">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Validées</p>
                      <p className="text-3xl font-bold text-emile-green">{detailedStats.validated_transactions}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-emile-green" />
                  </div>
                </div>
                <div className="card-emile">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Rejetées</p>
                      <p className="text-3xl font-bold text-emile-red">{detailedStats.rejected_transactions}</p>
                    </div>
                    <XCircle className="w-10 h-10 text-emile-red" />
                  </div>
                </div>
                <div className="card-emile">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Montant validé</p>
                      <p className="text-2xl font-bold text-white">
                        {detailedStats.total_amount_validated.toFixed(0)} FCFA
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 text-gray-500" />
                  </div>
                </div>
                <div className="card-emile">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Frais totaux</p>
                      <p className="text-2xl font-bold text-emile-green">
                        {detailedStats.total_commission.toFixed(0)} FCFA
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-emile-green" />
                  </div>
                </div>
              </div>
            )}

            {/* Performance par admin */}
            {adminStats.length > 0 && (
              <div className="card-emile">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Performance par admin</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Admin</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Validées</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Rejetées</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Montant traité</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Frais</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminStats.map((as) => (
                        <tr key={as.admin_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-white font-medium">{as.admin_name}</td>
                          <td className="py-3 px-4 text-center text-emile-green font-semibold">{as.validated}</td>
                          <td className="py-3 px-4 text-center text-emile-red font-semibold">{as.rejected}</td>
                          <td className="py-3 px-4 text-right text-white">{as.total_amount.toFixed(0)} FCFA</td>
                          <td className="py-3 px-4 text-right text-emile-green">{as.commission.toFixed(0)} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Liste des transactions */}
            {statsTransactions.length > 0 && (
              <div className="card-emile">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">
                      Transactions ({statsTransactions.length})
                    </h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="w-8"></th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium">ID</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium">Client</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium">Statut</th>
                        <th className="text-right py-3 px-3 text-gray-400 font-medium">Montant</th>
                        <th className="text-right py-3 px-3 text-gray-400 font-medium">Total</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium hidden md:table-cell">Admin</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-medium hidden lg:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsTransactions.map((t) => (
                        <React.Fragment key={t.id}>
                          <tr
                            className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                              expandedStatsTransaction === t.id ? 'bg-white/5' : ''
                            }`}
                            onClick={() => setExpandedStatsTransaction(expandedStatsTransaction === t.id ? null : t.id)}
                          >
                            <td className="py-3 px-2 text-center">
                              {expandedStatsTransaction === t.id ? (
                                <ChevronUp className="w-4 h-4 text-blue-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-white">{t.transaction_id}</td>
                            <td className="py-3 px-3 text-gray-300">
                              <div>{t.user_name || '-'}</div>
                              <div className="text-xs text-gray-500">{t.user_phone || ''}</div>
                            </td>
                            <td className="py-3 px-3">
                              {t.status === 'validated' && <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Validee</span>}
                              {t.status === 'rejected' && <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">Rejetee</span>}
                              {t.status === 'pending' && <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">En attente</span>}
                            </td>
                            <td className="py-3 px-3 text-right text-white">{t.amount.toFixed(0)}</td>
                            <td className="py-3 px-3 text-right text-emile-green font-medium">{t.total_amount.toFixed(0)}</td>
                            <td className="py-3 px-3 text-gray-300 hidden md:table-cell">{t.validated_by_name || t.assigned_admin_name || '-'}</td>
                            <td className="py-3 px-3 text-gray-400 text-xs whitespace-nowrap hidden lg:table-cell">
                              {new Date(t.created_at).toLocaleDateString('fr-FR')}
                              {' '}
                              {new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                          {expandedStatsTransaction === t.id && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <div className="bg-gray-800/50 border-t border-b border-white/10 px-4 py-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Infos client */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                                        <Users className="w-4 h-4" /> Client
                                      </h4>
                                      <div className="text-sm text-gray-300 space-y-1">
                                        <div><span className="text-gray-500">Nom:</span> {t.user_name || '-'}</div>
                                        <div><span className="text-gray-500">Tel:</span> {t.user_phone || '-'}</div>
                                        {t.user_email && <div><span className="text-gray-500">Email:</span> {t.user_email}</div>}
                                      </div>
                                    </div>

                                    {/* Infos transaction */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" /> Transaction
                                      </h4>
                                      <div className="text-sm text-gray-300 space-y-1">
                                        <div><span className="text-gray-500">ID:</span> <span className="font-mono">{t.transaction_id}</span></div>
                                        {t.exchange_pair_name && <div><span className="text-gray-500">Paire:</span> {t.exchange_pair_name}</div>}
                                        {t.exchange_pair_category && <div><span className="text-gray-500">Type:</span> {t.exchange_pair_category}</div>}
                                        <div><span className="text-gray-500">Reference:</span> {t.payment_reference}</div>
                                        {t.from_number && <div><span className="text-gray-500">Source:</span> {t.from_number}</div>}
                                        {t.to_number && <div><span className="text-gray-500">Destination:</span> {t.to_number}</div>}
                                        {t.bookmaker_name && <div><span className="text-gray-500">Bookmaker:</span> {t.bookmaker_name}</div>}
                                      </div>
                                    </div>

                                    {/* Détails transfert d'argent */}
                                    {t.dynamic_fields && (t.exchange_pair_category === 'money_transfer' || t.exchange_pair_category === 'card_order') && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                                          <Mail className="w-4 h-4" /> Détails demande
                                        </h4>
                                        <div className="text-sm text-gray-300 space-y-1">
                                          {t.dynamic_fields.operation_type && <div><span className="text-gray-500">Opération:</span> <span className="text-yellow-400">{t.dynamic_fields.operation_type === 'send' ? 'Envoi' : 'Retrait'}</span></div>}
                                          {t.dynamic_fields.transfer_service && <div><span className="text-gray-500">Service:</span> {t.dynamic_fields.transfer_service}</div>}
                                          {t.dynamic_fields.beneficiary_name && <div><span className="text-gray-500">Bénéficiaire:</span> {t.dynamic_fields.beneficiary_name}</div>}
                                          {t.dynamic_fields.beneficiary_phone && <div><span className="text-gray-500">Tél bénéf.:</span> {t.dynamic_fields.beneficiary_phone}</div>}
                                          {t.dynamic_fields.destination_country && <div><span className="text-gray-500">Pays dest.:</span> {t.dynamic_fields.destination_country}</div>}
                                          {t.dynamic_fields.origin_country && <div><span className="text-gray-500">Pays origine:</span> {t.dynamic_fields.origin_country}</div>}
                                          {t.dynamic_fields.mtcn_reference && <div><span className="text-gray-500">MTCN:</span> <span className="font-mono text-yellow-300">{t.dynamic_fields.mtcn_reference}</span></div>}
                                          {t.dynamic_fields.send_amount && <div><span className="text-gray-500">Montant envoi:</span> {t.dynamic_fields.send_amount} {t.dynamic_fields.send_currency || 'FCFA'}</div>}
                                          {t.dynamic_fields.withdrawal_amount && <div><span className="text-gray-500">Montant retrait:</span> {t.dynamic_fields.withdrawal_amount} FCFA</div>}
                                          {t.dynamic_fields.id_type && <div><span className="text-gray-500">Pièce ID:</span> {t.dynamic_fields.id_type} {t.dynamic_fields.id_number ? `- ${t.dynamic_fields.id_number}` : ''}</div>}
                                          {t.dynamic_fields.payment_method && <div><span className="text-gray-500">Paiement:</span> {t.dynamic_fields.payment_method}</div>}
                                        </div>
                                      </div>
                                    )}

                                    {/* Infos montant */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" /> Montants
                                      </h4>
                                      <div className="text-sm text-gray-300 space-y-1">
                                        <div><span className="text-gray-500">Montant:</span> <span className="text-white font-medium">{t.amount.toFixed(0)} FCFA</span></div>
                                        <div><span className="text-gray-500">Frais ({t.percentage}%):</span> <span className="text-yellow-400">{(t.total_amount - t.amount).toFixed(0)} FCFA</span></div>
                                        <div><span className="text-gray-500">Total:</span> <span className="text-emile-green font-bold">{t.total_amount.toFixed(0)} FCFA</span></div>
                                      </div>
                                    </div>

                                    {/* Infos traitement */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                                        <UserCheck className="w-4 h-4" /> Traitement
                                      </h4>
                                      <div className="text-sm text-gray-300 space-y-1">
                                        {t.assigned_admin_name && <div><span className="text-gray-500">Assigne a:</span> <span className="text-teal-400">{t.assigned_admin_name}</span></div>}
                                        {t.validated_by_name && <div><span className="text-gray-500">Traite par:</span> <span className="text-white">{t.validated_by_name}</span></div>}
                                        <div><span className="text-gray-500">Cree le:</span> {new Date(t.created_at).toLocaleString('fr-FR')}</div>
                                        {t.validated_at && <div><span className="text-gray-500">Traite le:</span> {new Date(t.validated_at).toLocaleString('fr-FR')}</div>}
                                      </div>
                                    </div>

                                    {/* Point de vente */}
                                    {t.point_de_vente_name && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                                          <MapPin className="w-4 h-4" /> Point de vente
                                        </h4>
                                        <div className="text-sm text-gray-300 space-y-1">
                                          <div>{t.point_de_vente_name}</div>
                                          {t.point_de_vente_address && <div className="text-xs text-gray-500">{t.point_de_vente_address}</div>}
                                        </div>
                                      </div>
                                    )}

                                    {/* Notes / Messages */}
                                    {(t.notes || t.admin_message) && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                                          <Mail className="w-4 h-4" /> Notes
                                        </h4>
                                        <div className="text-sm text-gray-300 space-y-1">
                                          {t.notes && <div><span className="text-gray-500">Note client:</span> {t.notes}</div>}
                                          {t.admin_message && <div><span className="text-gray-500">Message admin:</span> {t.admin_message}</div>}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Message vide */}
            {!statsLoading && !detailedStats && (
              <div className="card-emile text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Sélectionnez des filtres et cliquez sur Rechercher pour voir les statistiques</p>
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="space-y-6">
            {/* Notification Settings - Firebase */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Notifications Push Firebase</h3>
              <NotificationSettings />
            </div>

            {/* Configuration rapide */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 mt-8">Configuration rapide</h3>
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

          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-white">
                {activeTab === 'assigned' ? 'Mes assignations' : `Transactions ${activeTab === 'pending' ? 'en attente' : activeTab === 'validated' ? 'validées' : 'rejetées'}`}
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
                      if (activeTab === 'pending' || activeTab === 'assigned') {
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
                          {transaction.assigned_admin_name && (
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-teal-400" />
                              <strong className="text-white">Assigné à:</strong>
                              <span className="text-teal-400">{transaction.assigned_admin_name}</span>
                            </div>
                          )}
                          {transaction.point_de_vente_name && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-teal-400" />
                              <strong className="text-white">Point de vente:</strong> {transaction.point_de_vente_name}
                            </div>
                          )}
                          {/* Détails transfert d'argent / carte */}
                          {transaction.dynamic_fields && (transaction.exchange_pair_category === 'money_transfer' || transaction.exchange_pair_category === 'card_order') && (
                            <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10 space-y-1">
                              <div className="text-xs font-semibold text-teal-400 mb-1">Détails de la demande</div>
                              {transaction.dynamic_fields.operation_type && (
                                <div className="text-xs"><span className="text-gray-500">Opération:</span> <span className="text-yellow-400 font-medium">{transaction.dynamic_fields.operation_type === 'send' ? 'Envoi' : 'Retrait'}</span></div>
                              )}
                              {transaction.dynamic_fields.transfer_service && (
                                <div className="text-xs"><span className="text-gray-500">Service:</span> {transaction.dynamic_fields.transfer_service}</div>
                              )}
                              {transaction.dynamic_fields.beneficiary_name && (
                                <div className="text-xs"><span className="text-gray-500">Bénéficiaire:</span> {transaction.dynamic_fields.beneficiary_name}</div>
                              )}
                              {transaction.dynamic_fields.beneficiary_phone && (
                                <div className="text-xs"><span className="text-gray-500">Tél bénéficiaire:</span> {transaction.dynamic_fields.beneficiary_phone}</div>
                              )}
                              {transaction.dynamic_fields.destination_country && (
                                <div className="text-xs"><span className="text-gray-500">Pays destination:</span> {transaction.dynamic_fields.destination_country}</div>
                              )}
                              {transaction.dynamic_fields.origin_country && (
                                <div className="text-xs"><span className="text-gray-500">Pays d&apos;origine:</span> {transaction.dynamic_fields.origin_country}</div>
                              )}
                              {transaction.dynamic_fields.send_amount && (
                                <div className="text-xs"><span className="text-gray-500">Montant envoi:</span> {transaction.dynamic_fields.send_amount} {transaction.dynamic_fields.send_currency || 'FCFA'}</div>
                              )}
                              {transaction.dynamic_fields.withdrawal_amount && (
                                <div className="text-xs"><span className="text-gray-500">Montant retrait:</span> {transaction.dynamic_fields.withdrawal_amount} FCFA</div>
                              )}
                              {transaction.dynamic_fields.mtcn_reference && (
                                <div className="text-xs"><span className="text-gray-500">MTCN:</span> <span className="font-mono text-yellow-300">{transaction.dynamic_fields.mtcn_reference}</span></div>
                              )}
                              {transaction.dynamic_fields.id_type && (
                                <div className="text-xs"><span className="text-gray-500">Pièce d&apos;identité:</span> {transaction.dynamic_fields.id_type} {transaction.dynamic_fields.id_number ? `- ${transaction.dynamic_fields.id_number}` : ''}</div>
                              )}
                              {transaction.dynamic_fields.payment_method && (
                                <div className="text-xs"><span className="text-gray-500">Mode de paiement:</span> {transaction.dynamic_fields.payment_method}</div>
                              )}
                              {transaction.dynamic_fields.client_location && (
                                <div className="text-xs"><span className="text-gray-500">Localisation client:</span> {transaction.dynamic_fields.client_location}</div>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(transaction.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center justify-end gap-2 mb-2">
                          {activeTab === 'assigned' && transaction.assignment_expires_at && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <AssignmentTimer
                                expiresAt={transaction.assignment_expires_at}
                                onExpired={() => loadData()}
                              />
                            </div>
                          )}
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
                          Frais: {((transaction.total_amount - transaction.amount)).toFixed(0)} FCFA
                        </div>
                        <div className="text-sm font-medium text-emile-green">
                          Total: {transaction.total_amount.toFixed(0)} FCFA
                        </div>
                      </div>
                    </div>

                    {/* Mes assignations : Accepter / Refuser */}
                    {activeTab === 'assigned' && selectedTransaction?.id === transaction.id && hasPermission('VALIDATE_TRANSACTIONS') && (
                      <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptAssignment(transaction.id);
                            }}
                            className="btn-emile-success flex-1"
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Accepter
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefuseAssignment(transaction.id);
                            }}
                            className="btn-emile-danger flex-1"
                            disabled={loading}
                          >
                            <RotateCcw className="w-4 h-4 inline mr-2" />
                            Refuser
                          </button>
                        </div>
                      </div>
                    )}

                    {/* En attente : Valider / Rejeter */}
                    {activeTab === 'pending' && selectedTransaction?.id === transaction.id && hasPermission('VALIDATE_TRANSACTIONS') && (
                      <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                        {transaction.exchange_pair_category === 'subscription' && (
                          <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-lg p-4 mb-3">
                            <label className="block text-sm font-semibold text-blue-300 mb-2">
                              Message pour le client (REQUIS pour les abonnements) *
                            </label>
                            <textarea
                              className="input-emile"
                              rows={4}
                              placeholder="Ex: Votre abonnement Canalbox a été activé avec succès. Numéro de décodeur: 123456789. Profitez de vos programmes!"
                              value={adminMessage}
                              onChange={(e) => {
                                e.stopPropagation();
                                setAdminMessage(e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <p className="text-xs text-blue-400 mt-2">
                              Ce message sera envoyé au client par notification et email
                            </p>
                          </div>
                        )}
                        <textarea
                          className="input-emile"
                          rows={2}
                          placeholder="Commentaire interne (optionnel)..."
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
