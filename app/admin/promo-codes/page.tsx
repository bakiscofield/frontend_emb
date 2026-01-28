'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  Calendar,
  User,
  TrendingUp,
  Clock,
  Percent,
  Hash
} from 'lucide-react';
import { promoCodesAPI, usersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import GlassCard from '@/components/GlassCard';
import NeonButton from '@/components/NeonButton';
import AnimatedInput from '@/components/AnimatedInput';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

interface PromoCode {
  id: number;
  code: string;
  discount_percent: number;
  valid_from: string;
  valid_until: string;
  user_id: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  users?: {
    id: number;
    name: string;
    phone: string;
  };
  promo_code_usage?: any[];
}

interface UserOption {
  id: number;
  name: string;
  phone: string;
}

export default function PromoCodesPage() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin } = useAuthStore();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    valid_from: '',
    valid_until: '',
    user_id: '',
    max_uses: ''
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchPromoCodes();
    fetchUsers();
  }, [isAuthenticated, isAdmin, router]);

  const fetchPromoCodes = async () => {
    try {
      const response = await promoCodesAPI.getAll();
      setPromoCodes(response.data.promo_codes);
    } catch (error) {
      toast.error('Erreur lors du chargement des codes promo');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discount_percent: parseFloat(formData.discount_percent),
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until,
        user_id: formData.user_id ? parseInt(formData.user_id) : undefined,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined
      };

      await promoCodesAPI.create(payload);
      toast.success('Code promo créé avec succès');

      setIsModalOpen(false);
      setEditingPromoCode(null);
      setFormData({
        code: '',
        discount_percent: '',
        valid_from: '',
        valid_until: '',
        user_id: '',
        max_uses: ''
      });
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) return;

    try {
      await promoCodesAPI.delete(id.toString());
      toast.success('Code promo supprimé');
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const toggleActive = async (promoCode: PromoCode) => {
    try {
      await promoCodesAPI.toggle(promoCode.id.toString());
      toast.success(`Code promo ${!promoCode.is_active ? 'activé' : 'désactivé'}`);
      fetchPromoCodes();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const getUsagePercentage = (current: number, max: number | null) => {
    if (!max) return 0;
    return (current / max) * 100;
  };

  if (!isAuthenticated || !isAdmin || !admin) {
    return null;
  }

  return (
    <>
      {/* Header EMILE TRANSFER+ avec logo */}
      <Header
        title="EMILE TRANSFER"
        subtitle="Codes Promo"
        userName={admin.username}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
      />

      <div className="min-h-screen p-3 sm:p-6 relative">
        {/* Cyber grid background */}
        <div className="cyber-grid" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              🎟️ Codes Promo
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Créez et gérez les codes promotionnels pour vos utilisateurs
            </p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <GlassCard className="p-3 sm:p-4" glow glowColor="green">
              <div className="flex items-center gap-2 sm:gap-3">
                <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-emile-green" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">{promoCodes.length}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-3 sm:p-4" glow glowColor="green">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emile-green" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Actifs</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    {promoCodes.filter(p => p.is_active && !isExpired(p.valid_until)).length}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-3 sm:p-4" glow glowColor="red">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Expirés</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    {promoCodes.filter(p => isExpired(p.valid_until)).length}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-3 sm:p-4" glow glowColor="red">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Utilisations</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    {promoCodes.reduce((sum, p) => sum + p.current_uses, 0)}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Add Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 sm:mb-6"
          >
            <NeonButton
              variant="primary"
              onClick={() => {
                setEditingPromoCode(null);
                setFormData({
                  code: '',
                  discount_percent: '',
                  valid_from: '',
                  valid_until: '',
                  user_id: '',
                  max_uses: ''
                });
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Créer un code promo</span>
            </NeonButton>
          </motion.div>

          {/* Promo Codes List */}
          {promoCodes.length === 0 ? (
            <GlassCard className="p-8 sm:p-12 text-center" glow glowColor="green">
              <Tag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-400">
                Aucun code promo créé. Cliquez sur "Créer un code promo" pour commencer.
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {promoCodes.map((promoCode, index) => {
                const expired = isExpired(promoCode.valid_until);
                const usagePercent = getUsagePercentage(promoCode.current_uses, promoCode.max_uses);
                const isAlmostFull = promoCode.max_uses && usagePercent >= 80;

                return (
                  <GlassCard
                    key={promoCode.id}
                    glow
                    glowColor={expired ? 'red' : promoCode.is_active ? 'green' : 'red'}
                    className="p-4 sm:p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Header with Code and Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-emile-green flex-shrink-0" />
                          <h3 className="text-xl sm:text-2xl font-bold text-white font-mono truncate">
                            {promoCode.code}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-emile-green" />
                          <span className="text-lg sm:text-xl font-semibold text-emile-green">
                            -{promoCode.discount_percent}%
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleActive(promoCode)}
                        className="transition-transform hover:scale-110 flex-shrink-0"
                        disabled={expired}
                      >
                        {promoCode.is_active && !expired ? (
                          <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emile-green" />
                        ) : (
                          <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emile-red" />
                        )}
                      </button>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {expired && (
                        <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
                          ⏰ Expiré
                        </span>
                      )}
                      {!promoCode.is_active && !expired && (
                        <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-lg border border-gray-500/30">
                          Désactivé
                        </span>
                      )}
                      {promoCode.user_id && (
                        <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                          👤 Utilisateur spécifique
                        </span>
                      )}
                      {isAlmostFull && !expired && (
                        <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30">
                          ⚠️ Presque épuisé
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-xs sm:text-sm">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="text-gray-400">Valide du </span>
                          <span className="text-white">
                            {new Date(promoCode.valid_from).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-gray-400"> au </span>
                          <span className={expired ? 'text-red-400' : 'text-white'}>
                            {new Date(promoCode.valid_until).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {promoCode.user_id && promoCode.users && (
                        <div className="flex items-start gap-2">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-400">Pour: </span>
                            <span className="text-white truncate">
                              {promoCode.users.name} ({promoCode.users.phone})
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-gray-400">Utilisations: </span>
                        <span className={`font-semibold ${isAlmostFull ? 'text-yellow-400' : 'text-white'}`}>
                          {promoCode.current_uses}
                          {promoCode.max_uses ? ` / ${promoCode.max_uses}` : ' / ∞'}
                        </span>
                      </div>

                      {/* Usage Progress Bar */}
                      {promoCode.max_uses && (
                        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              usagePercent >= 100
                                ? 'bg-red-500'
                                : usagePercent >= 80
                                ? 'bg-yellow-500'
                                : 'bg-emile-green'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(promoCode.id)}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-emile-red/20 hover:bg-emile-red/30 text-emile-red rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Supprimer</span>
                        <span className="xs:hidden">Supp.</span>
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* Modal */}
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
              onClick={() => setIsModalOpen(false)}
            >
              <GlassCard
                className="w-full max-w-2xl p-4 sm:p-6 my-4"
                glow
                glowColor="red"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  Créer un code promo
                </h2>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <AnimatedInput
                      label="Code promo *"
                      placeholder="Ex: PROMO2025"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />

                    <AnimatedInput
                      label="Réduction (%) *"
                      type="number"
                      placeholder="Ex: 10"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-400 mb-2">
                        Date de début (optionnel)
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:outline-none focus:border-emile-green/50"
                        value={formData.valid_from}
                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm text-gray-400 mb-2">
                        Date de fin *
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:outline-none focus:border-emile-green/50"
                        value={formData.valid_until}
                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-400 mb-2">
                        Utilisateur spécifique (optionnel)
                      </label>
                      <select
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:outline-none focus:border-emile-green/50"
                        value={formData.user_id}
                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      >
                        <option value="">Tous les utilisateurs</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <AnimatedInput
                      label="Nombre max d'utilisations (optionnel)"
                      type="number"
                      placeholder="Illimité si vide"
                      min="1"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-blue-300">
                    <p className="font-semibold mb-2">💡 Informations:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Le code sera automatiquement converti en majuscules</li>
                      <li>Si aucune date de début n'est spécifiée, le code sera actif immédiatement</li>
                      <li>Si aucun utilisateur n'est spécifié, le code sera utilisable par tous</li>
                      <li>Si aucun nombre max n'est spécifié, le code sera illimité</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                    <NeonButton
                      type="submit"
                      variant="primary"
                      fullWidth
                    >
                      <span className="text-sm sm:text-base">Créer le code promo</span>
                    </NeonButton>
                    <NeonButton
                      type="button"
                      variant="secondary"
                      fullWidth
                      onClick={() => setIsModalOpen(false)}
                    >
                      <span className="text-sm sm:text-base">Annuler</span>
                    </NeonButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
