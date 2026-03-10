'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { commissionAPI } from '@/lib/api';
import Header from '@/components/Header';
import NotificationBell from '@/components/NotificationBell';
import toast from 'react-hot-toast';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle,
  XCircle,
  Hourglass
} from 'lucide-react';

interface LedgerEntry {
  id: number;
  admin_id: number;
  type: string;
  amount: number;
  balance_after: number;
  transaction_id: number | null;
  description: string | null;
  created_at: string;
  transactions?: {
    transaction_id: string;
    amount: number;
    total_amount: number;
  } | null;
}

interface WithdrawalRequest {
  id: number;
  admin_id: number;
  amount: number;
  network: string;
  phone_number: string;
  status: string;
  requested_at: string;
  processed_by: number | null;
  processed_at: string | null;
  rejection_reason: string | null;
  admins?: {
    id: number;
    username: string;
    email: string | null;
    commission_balance: number;
  };
}

interface AdminBalance {
  id: number;
  username: string;
  email: string | null;
  commission_balance: number;
}

export default function CommissionsPage() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin, initAuth, hasPermission, hasAnyPermission } = useAuthStore();

  const [balance, setBalance] = useState(0);
  const [totalCredited, setTotalCredited] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const [allAdmins, setAllAdmins] = useState<AdminBalance[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [adminEntries, setAdminEntries] = useState<LedgerEntry[]>([]);
  const [adminEntriesTotal, setAdminEntriesTotal] = useState(0);
  const [adminPage, setAdminPage] = useState(0);

  const [myRequests, setMyRequests] = useState<WithdrawalRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<WithdrawalRequest[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const canManage = hasAnyPermission('MANAGE_COMMISSIONS');
  const canApprove = hasAnyPermission('APPROVE_WITHDRAWALS');
  const isAdminRole = admin?.role === 'admin';

  useEffect(() => {
    initAuth();
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isAdmin, router, initAuth]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadBalance();
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadHistory();
    }
  }, [isAuthenticated, isAdmin, typeFilter, page]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadMyRequests();
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && canApprove) {
      loadPendingRequests();
    }
  }, [isAuthenticated, isAdmin, canApprove]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && canManage) {
      loadAllAdmins();
    }
  }, [isAuthenticated, isAdmin, canManage]);

  useEffect(() => {
    if (selectedAdminId) {
      loadAdminHistory(selectedAdminId);
    }
  }, [selectedAdminId, adminPage]);

  const loadBalance = async () => {
    try {
      const res = await commissionAPI.getBalance();
      setBalance(res.data.balance || 0);
      setTotalCredited(res.data.summary.total_credited || 0);
      setTotalWithdrawn(res.data.summary.total_withdrawn || 0);
      setTotalEntries(res.data.summary.total_entries || 0);
    } catch {
      toast.error('Erreur lors du chargement du solde');
    }
  };

  const loadHistory = async () => {
    try {
      const params: any = { limit: pageSize, offset: page * pageSize };
      if (typeFilter) params.type = typeFilter;
      const res = await commissionAPI.getHistory(params);
      setEntries(res.data.entries || []);
      setEntriesTotal(res.data.total || 0);
    } catch {
      toast.error('Erreur lors du chargement de l\'historique');
    }
  };

  const loadAllAdmins = async () => {
    try {
      const res = await commissionAPI.getAllBalances();
      setAllAdmins(res.data.admins || []);
    } catch {}
  };

  const loadAdminHistory = async (adminId: string) => {
    try {
      const params: any = { limit: pageSize, offset: adminPage * pageSize };
      const res = await commissionAPI.getAdminHistory(adminId, params);
      setAdminEntries(res.data.entries || []);
      setAdminEntriesTotal(res.data.total || 0);
    } catch {
      toast.error('Erreur lors du chargement de l\'historique admin');
    }
  };

  const loadMyRequests = async () => {
    try {
      const res = await commissionAPI.getWithdrawalRequests();
      setMyRequests(res.data.requests || []);
    } catch {}
  };

  const loadPendingRequests = async () => {
    try {
      const res = await commissionAPI.getAllWithdrawalRequests('pending');
      setPendingRequests(res.data.requests || []);
    } catch {}
  };

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await commissionAPI.approveWithdrawal(id);
      toast.success('Retrait approuvé');
      loadPendingRequests();
      loadAllAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await commissionAPI.rejectWithdrawal(id, rejectReason);
      toast.success('Demande rejetée');
      setRejectingId(null);
      setRejectReason('');
      loadPendingRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du rejet');
    } finally {
      setProcessingId(null);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    if (amount > balance) {
      toast.error('Solde insuffisant');
      return;
    }
    if (!withdrawNetwork) {
      toast.error('Veuillez sélectionner un réseau');
      return;
    }
    if (!withdrawPhone || withdrawPhone.trim().length < 8) {
      toast.error('Veuillez entrer un numéro de retrait valide');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await commissionAPI.withdraw(amount, withdrawNetwork, withdrawPhone.trim());
      if (res.data.pending) {
        toast.success('Demande de retrait envoyée, en attente d\'approbation');
        loadMyRequests();
      } else {
        toast.success(`Retrait de ${amount.toLocaleString('fr-FR')} FCFA effectué via ${withdrawNetwork.toUpperCase()}`);
        loadBalance();
        loadHistory();
      }
      setWithdrawAmount('');
      setWithdrawNetwork('');
      setWithdrawPhone('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du retrait');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(entriesTotal / pageSize);
  const adminTotalPages = Math.ceil(adminEntriesTotal / pageSize);

  if (!isAuthenticated || !isAdmin || !admin) return null;

  return (
    <>
      <Header
        title="EMILE TRANSFER"
        subtitle="Commissions"
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
        <div className="cyber-grid"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 space-y-6">

          {/* Sections agent uniquement : solde, retrait, historique personnel */}
          {!isAdminRole && (
            <>
              {/* Carte résumé */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl p-5 text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-6 h-6 text-emerald-200" />
                    <span className="text-emerald-100 text-sm">Solde actuel</span>
                  </div>
                  <p className="text-2xl font-bold">{balance.toLocaleString('fr-FR')} FCFA</p>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-white border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <span className="text-gray-400 text-sm">Total crédité</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{totalCredited.toLocaleString('fr-FR')} FCFA</p>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-white border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-6 h-6 text-red-400" />
                    <span className="text-gray-400 text-sm">Total retiré</span>
                  </div>
                  <p className="text-2xl font-bold text-red-400">{totalWithdrawn.toLocaleString('fr-FR')} FCFA</p>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-white border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-6 h-6 text-blue-400" />
                    <span className="text-gray-400 text-sm">Transactions</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{totalEntries}</p>
                </div>
              </div>

              {/* Formulaire retrait */}
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                  Retrait de commission
                </h2>
                <div className="space-y-4">
                  {/* Sélection du réseau */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Réseau de retrait</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setWithdrawNetwork('flooz')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                          withdrawNetwork === 'flooz'
                            ? 'bg-yellow-600 text-white border-2 border-yellow-400 shadow-lg shadow-yellow-600/20'
                            : 'bg-gray-700 text-gray-300 border-2 border-white/10 hover:border-yellow-500/50'
                        }`}
                      >
                        Flooz
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawNetwork('tmoney')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                          withdrawNetwork === 'tmoney'
                            ? 'bg-blue-600 text-white border-2 border-blue-400 shadow-lg shadow-blue-600/20'
                            : 'bg-gray-700 text-gray-300 border-2 border-white/10 hover:border-blue-500/50'
                        }`}
                      >
                        TMoney
                      </button>
                    </div>
                  </div>

                  {/* Numéro de retrait */}
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Numéro de retrait</label>
                    <input
                      type="tel"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      placeholder="Ex: 90123456"
                      className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Montant + Bouton */}
                  <div className="flex gap-3 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-gray-400 text-sm mb-1 block">Montant (FCFA)</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Ex: 5000"
                        min="1"
                        max={balance}
                        className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !withdrawNetwork || !withdrawPhone}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawing ? 'Retrait...' : 'Retirer'}
                    </button>
                  </div>
                </div>
                {balance > 0 && (
                  <p className="text-gray-500 text-xs mt-2">
                    Solde disponible : {balance.toLocaleString('fr-FR')} FCFA
                  </p>
                )}
              </div>
            </>
          )}

          {/* Mes demandes de retrait (agents) */}
          {!isAdminRole && myRequests.length > 0 && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Hourglass className="w-5 h-5 text-yellow-400" />
                Mes demandes de retrait
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-white/10">
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-right py-2 px-3">Montant</th>
                      <th className="text-left py-2 px-3">Réseau</th>
                      <th className="text-left py-2 px-3">Numéro</th>
                      <th className="text-center py-2 px-3">Statut</th>
                      <th className="text-left py-2 px-3">Raison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((req) => (
                      <tr key={req.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2.5 px-3 text-gray-300 whitespace-nowrap">{formatDate(req.requested_at)}</td>
                        <td className="py-2.5 px-3 text-right text-white font-medium">
                          {req.amount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-2.5 px-3 text-gray-300 uppercase">{req.network}</td>
                        <td className="py-2.5 px-3 text-gray-300">{req.phone_number}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            req.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : req.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {req.status === 'pending' ? 'En attente' : req.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 text-xs max-w-[200px] truncate">
                          {req.rejection_reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Demandes en attente (admin avec permission APPROVE_WITHDRAWALS) */}
          {canApprove && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Hourglass className="w-5 h-5 text-orange-400" />
                Demandes de retrait en attente
              </h2>

              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune demande en attente</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="text-left py-2 px-3">Agent</th>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-right py-2 px-3">Montant</th>
                        <th className="text-left py-2 px-3">Réseau</th>
                        <th className="text-left py-2 px-3">Numéro</th>
                        <th className="text-right py-2 px-3">Solde agent</th>
                        <th className="text-center py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((req) => (
                        <tr key={req.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2.5 px-3 text-white font-medium">{req.admins?.username || '-'}</td>
                          <td className="py-2.5 px-3 text-gray-300 whitespace-nowrap">{formatDate(req.requested_at)}</td>
                          <td className="py-2.5 px-3 text-right text-white font-medium">
                            {req.amount.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="py-2.5 px-3 text-gray-300 uppercase">{req.network}</td>
                          <td className="py-2.5 px-3 text-gray-300">{req.phone_number}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400">
                            {(req.admins?.commission_balance || 0).toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {rejectingId === req.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Raison (optionnel)"
                                  className="px-2 py-1 rounded bg-gray-700 border border-white/10 text-white text-xs w-32 focus:outline-none focus:border-red-500"
                                />
                                <button
                                  onClick={() => handleReject(req.id)}
                                  disabled={processingId === req.id}
                                  className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-50"
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                  className="text-gray-400 hover:text-white text-xs"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleApprove(req.id)}
                                  disabled={processingId === req.id}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 text-xs font-medium disabled:opacity-50"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Approuver
                                </button>
                                <button
                                  onClick={() => setRejectingId(req.id)}
                                  disabled={processingId === req.id}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs font-medium disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Rejeter
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Historique (agents seulement) */}
          {!isAdminRole && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Historique des commissions
                </h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Tous</option>
                    <option value="credit">Crédits</option>
                    <option value="debit">Débits</option>
                  </select>
                </div>
              </div>

              {entries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune entrée</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-white/10">
                          <th className="text-left py-2 px-3">Date</th>
                          <th className="text-left py-2 px-3">Type</th>
                          <th className="text-right py-2 px-3">Montant</th>
                          <th className="text-right py-2 px-3">Solde après</th>
                          <th className="text-left py-2 px-3">Transaction</th>
                          <th className="text-left py-2 px-3">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry) => (
                          <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-2.5 px-3 text-gray-300 whitespace-nowrap">{formatDate(entry.created_at)}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                entry.type === 'credit'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {entry.type === 'credit' ? 'Crédit' : 'Débit'}
                              </span>
                            </td>
                            <td className={`py-2.5 px-3 text-right font-medium ${
                              entry.type === 'credit' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {entry.type === 'credit' ? '+' : '-'}{entry.amount.toLocaleString('fr-FR')} FCFA
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-300">
                              {entry.balance_after.toLocaleString('fr-FR')} FCFA
                            </td>
                            <td className="py-2.5 px-3 text-gray-400 text-xs">
                              {entry.transactions?.transaction_id || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-gray-400 text-xs max-w-[200px] truncate">
                              {entry.description || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-gray-500 text-sm">
                        Page {page + 1} / {totalPages} ({entriesTotal} entrées)
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1}
                          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Section super-admin : tous les admins */}
          {canManage && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Soldes de tous les agents
              </h2>

              {allAdmins.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun admin</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="text-left py-2 px-3">Admin</th>
                        <th className="text-left py-2 px-3">Email</th>
                        <th className="text-right py-2 px-3">Solde</th>
                        <th className="text-center py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAdmins.map((a) => (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2.5 px-3 text-white font-medium">{a.username}</td>
                          <td className="py-2.5 px-3 text-gray-400">{a.email || '-'}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">
                            {a.commission_balance.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => { setSelectedAdminId(a.id.toString()); setAdminPage(0); }}
                              className="text-blue-400 hover:text-blue-300 text-xs underline"
                            >
                              Voir historique
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Historique d'un admin spécifique */}
              {selectedAdminId && (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">
                      Historique de {allAdmins.find(a => a.id.toString() === selectedAdminId)?.username}
                    </h3>
                    <button
                      onClick={() => setSelectedAdminId(null)}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Fermer
                    </button>
                  </div>

                  {adminEntries.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucune entrée</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 border-b border-white/10">
                              <th className="text-left py-2 px-3">Date</th>
                              <th className="text-left py-2 px-3">Type</th>
                              <th className="text-right py-2 px-3">Montant</th>
                              <th className="text-right py-2 px-3">Solde après</th>
                              <th className="text-left py-2 px-3">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminEntries.map((entry) => (
                              <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2.5 px-3 text-gray-300 whitespace-nowrap">{formatDate(entry.created_at)}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    entry.type === 'credit'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {entry.type === 'credit' ? 'Crédit' : 'Débit'}
                                  </span>
                                </td>
                                <td className={`py-2.5 px-3 text-right font-medium ${
                                  entry.type === 'credit' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {entry.type === 'credit' ? '+' : '-'}{entry.amount.toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="py-2.5 px-3 text-right text-gray-300">
                                  {entry.balance_after.toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="py-2.5 px-3 text-gray-400 text-xs max-w-[200px] truncate">
                                  {entry.description || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {adminTotalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-gray-500 text-sm">
                            Page {adminPage + 1} / {adminTotalPages}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAdminPage(p => Math.max(0, p - 1))}
                              disabled={adminPage === 0}
                              className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setAdminPage(p => Math.min(adminTotalPages - 1, p + 1))}
                              disabled={adminPage >= adminTotalPages - 1}
                              className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
