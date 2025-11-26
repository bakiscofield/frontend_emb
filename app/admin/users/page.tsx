'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Header from '@/components/Header';
import VerifiedBadge from '@/components/VerifiedBadge';
import toast from 'react-hot-toast';
import { Search, Users, TrendingUp, UserCheck, UserX, Mail, History, DollarSign, MailX } from 'lucide-react';

interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  is_active: boolean;
  newsletter_subscribed: boolean;
  kyc_verified?: boolean;
  created_at: string;
  transaction_count: number;
  total_amount_spent: number;
  last_transaction_date: string;
}

interface Transaction {
  id: number;
  transaction_id: string;
  amount: number;
  total_amount: number;
  status: string;
  exchange_type: string;
  created_at: string;
  payment_reference: string;
}

interface Stats {
  general: {
    total_users: number;
    subscribed_users: number;
    active_users: number;
    inactive_users: number;
    new_users_30d: number;
  };
  transactions: {
    users_with_transactions: number;
    total_transactions: number;
    total_revenue: number;
  };
  topUsers: Array<{
    id: number;
    name: string;
    phone: string;
    email: string;
    transaction_count: number;
    total_spent: number;
  }>;
}

export default function UserManagement() {
  const router = useRouter();
  const { admin, isAdmin, logoutAdmin } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newsletterFilter, setNewsletterFilter] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [toggleReason, setToggleReason] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchUsers();
    fetchStats();
  }, [isAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (newsletterFilter !== 'all') {
        params.newsletter_subscribed = newsletterFilter === 'subscribed';
      }

      const response = await usersAPI.getAll(params);
      setUsers(response.data.users);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await usersAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const handleToggleActive = async (user: User) => {
    setUserToToggle(user);
    setToggleReason('');
    setShowToggleModal(true);
  };

  const confirmToggleActive = async () => {
    if (!userToToggle) return;

    try {
      await usersAPI.toggleActive(userToToggle.id.toString());
      toast.success(`Utilisateur ${userToToggle.is_active ? 'désactivé' : 'activé'}`);
      setShowToggleModal(false);
      setUserToToggle(null);
      setToggleReason('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleToggleNewsletter = async (user: User) => {
    try {
      await usersAPI.updateNewsletter(
        user.id.toString(),
        !user.newsletter_subscribed
      );
      toast.success(
        `Abonnement ${user.newsletter_subscribed ? 'désactivé' : 'activé'}`
      );
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleViewDetails = async (user: User) => {
    try {
      setSelectedUser(user);
      const response = await usersAPI.getTransactions(user.id.toString());
      setUserTransactions(response.data.transactions);
      setShowDetailsModal(true);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAdmin) {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, newsletterFilter]);

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="EMILE TRANSFER"
        subtitle="Gestion des Utilisateurs"
        userName={admin?.username || 'Admin'}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-3 sm:p-6">
        <div className="cyber-grid"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-3xl font-bold text-white">Gestion des Utilisateurs</h1>
            <button
              onClick={() => setShowStatsModal(true)}
              className="px-3 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Statistiques détaillées</span>
              <span className="sm:hidden">Stats</span>
            </button>
          </div>

          {/* Statistiques rapides */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-8">
              <div className="card-emile p-3 sm:p-4">
                <div className="text-gray-400 text-xs sm:text-sm mb-1">Total Utilisateurs</div>
                <div className="text-xl sm:text-3xl font-bold text-white">{stats.general.total_users}</div>
              </div>
              <div className="card-emile p-3 sm:p-4">
                <div className="text-gray-400 text-xs sm:text-sm mb-1">Actifs</div>
                <div className="text-xl sm:text-3xl font-bold text-green-500">{stats.general.active_users}</div>
              </div>
              <div className="card-emile p-3 sm:p-4">
                <div className="text-gray-400 text-xs sm:text-sm mb-1">Inactifs</div>
                <div className="text-xl sm:text-3xl font-bold text-red-500">{stats.general.inactive_users}</div>
              </div>
              <div className="card-emile p-3 sm:p-4">
                <div className="text-gray-400 text-xs sm:text-sm mb-1">Newsletter</div>
                <div className="text-xl sm:text-3xl font-bold text-purple-500">{stats.general.subscribed_users}</div>
              </div>
              <div className="card-emile p-3 sm:p-4">
                <div className="text-gray-400 text-xs sm:text-sm mb-1">Nouveaux (30j)</div>
                <div className="text-xl sm:text-3xl font-bold text-blue-500">{stats.general.new_users_30d}</div>
              </div>
            </div>
          )}

          {/* Filtres et recherche */}
          <div className="card-emile mb-4 sm:mb-6 p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  value={newsletterFilter}
                  onChange={(e) => setNewsletterFilter(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="subscribed">Abonnés</option>
                  <option value="unsubscribed">Non abonnés</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div className="space-y-3 sm:space-y-4">
            {users.length === 0 ? (
              <div className="card-emile text-center py-8 sm:py-12">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-400">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="card-emile p-3 sm:p-4 hover:border-red-500/50 transition-all cursor-pointer"
                  onClick={() => handleViewDetails(user)}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                          {user.name}
                          {user.kyc_verified && <VerifiedBadge size="sm" />}
                        </h3>
                        {user.is_active ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded-full whitespace-nowrap">
                            Actif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs rounded-full whitespace-nowrap">
                            Inactif
                          </span>
                        )}
                        {user.newsletter_subscribed && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-500 text-xs rounded-full whitespace-nowrap">
                            Newsletter
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300 space-y-0.5 sm:space-y-1">
                        <div><strong>Tél:</strong> {user.phone}</div>
                        <div className="hidden sm:block"><strong>Email:</strong> {user.email || 'Non renseigné'}</div>
                        <div className="text-gray-400 text-xs">
                          <strong>Inscrit:</strong> {new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col justify-between sm:text-right gap-3 sm:gap-0">
                      <div>
                        <div className="text-sm sm:text-lg font-bold text-white mb-0.5 sm:mb-1">
                          {user.transaction_count} trans.
                        </div>
                        <div className="text-xs sm:text-sm text-green-500">
                          {user.total_amount_spent?.toFixed(0) || 0} FCFA
                        </div>
                        {user.last_transaction_date && (
                          <div className="text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
                            Dernière: {new Date(user.last_transaction_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 sm:mt-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(user);
                          }}
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            user.is_active
                              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                              : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                          }`}
                        >
                          {user.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNewsletter(user);
                          }}
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            user.newsletter_subscribed
                              ? 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30'
                              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                          }`}
                        >
                          {user.newsletter_subscribed ? <Mail className="w-3 h-3" /> : <MailX className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Détails Utilisateur */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    {selectedUser.name}
                    {selectedUser.kyc_verified && <VerifiedBadge size="md" />}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.is_active ? (
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/20 text-green-500 text-xs sm:text-sm rounded-full">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-red-500/20 text-red-500 text-xs sm:text-sm rounded-full">
                        Inactif
                      </span>
                    )}
                    {selectedUser.newsletter_subscribed && (
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-500/20 text-purple-500 text-xs sm:text-sm rounded-full">
                        Newsletter
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white text-xl sm:text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-400">Téléphone:</span>
                  <span className="text-white ml-2">{selectedUser.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white ml-2 text-xs sm:text-sm break-all">{selectedUser.email || 'Non renseigné'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Inscrit le:</span>
                  <span className="text-white ml-2">
                    {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total dépensé:</span>
                  <span className="text-green-500 ml-2 font-bold">
                    {selectedUser.total_amount_spent?.toFixed(0) || 0} FCFA
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
                <History className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Historique ({userTransactions.length})
              </h3>

              {userTransactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <History className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-400">Aucune transaction</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {userTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs sm:text-sm text-gray-300 mb-1 truncate">
                            {transaction.transaction_id}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">
                            {transaction.exchange_type}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(transaction.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 hidden sm:block">
                            Réf: {transaction.payment_reference}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm sm:text-lg font-bold text-white">
                            {transaction.amount.toFixed(0)}
                          </div>
                          <div className="text-xs sm:text-sm text-green-500">
                            {transaction.total_amount.toFixed(0)} FCFA
                          </div>
                          <span
                            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                              transaction.status === 'validated'
                                ? 'bg-green-500/20 text-green-500'
                                : transaction.status === 'rejected'
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}
                          >
                            {transaction.status === 'validated'
                              ? 'Validée'
                              : transaction.status === 'rejected'
                              ? 'Rejetée'
                              : 'Attente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Statistiques Détaillées */}
      {showStatsModal && stats && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Statistiques Détaillées</h2>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats transactions */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Statistiques Transactions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="card-emile">
                    <div className="text-gray-400 text-sm mb-1">Utilisateurs avec transactions</div>
                    <div className="text-3xl font-bold text-blue-500">
                      {stats.transactions.users_with_transactions}
                    </div>
                  </div>
                  <div className="card-emile">
                    <div className="text-gray-400 text-sm mb-1">Total Transactions</div>
                    <div className="text-3xl font-bold text-white">
                      {stats.transactions.total_transactions}
                    </div>
                  </div>
                  <div className="card-emile">
                    <div className="text-gray-400 text-sm mb-1">Revenu Total</div>
                    <div className="text-2xl font-bold text-green-500">
                      {stats.transactions.total_revenue.toFixed(0)} FCFA
                    </div>
                  </div>
                </div>
              </div>

              {/* Top utilisateurs */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Top 10 Utilisateurs</h3>
                <div className="space-y-3">
                  {stats.topUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center font-bold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-sm text-gray-400">{user.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-500">
                          {user.total_spent.toFixed(0)} FCFA
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.transaction_count} transactions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Toggle Active */}
      {showToggleModal && userToToggle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl max-w-md w-full">
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {userToToggle.is_active ? 'Désactiver' : 'Activer'} le compte
              </h2>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base text-gray-300">
                Êtes-vous sûr de vouloir {userToToggle.is_active ? 'désactiver' : 'activer'} le compte de{' '}
                <span className="font-bold text-white">{userToToggle.name}</span> ?
              </p>

              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2">
                  Motif (optionnel)
                </label>
                <textarea
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                  rows={3}
                  placeholder="Entrez le motif de cette action..."
                  value={toggleReason}
                  onChange={(e) => setToggleReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowToggleModal(false);
                    setUserToToggle(null);
                    setToggleReason('');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmToggleActive}
                  className={`flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                    userToToggle.is_active
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
