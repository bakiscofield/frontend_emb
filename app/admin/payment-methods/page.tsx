'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { paymentMethodsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import GlassCard from '@/components/GlassCard';
import NeonButton from '@/components/NeonButton';
import AnimatedInput from '@/components/AnimatedInput';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  icon: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin } = useAuthStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    icon: '',
    description: ''
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchMethods();
  }, [isAuthenticated, isAdmin, router]);

  const fetchMethods = async () => {
    try {
      const response = await paymentMethodsAPI.getAll();
      setMethods(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des moyens de paiement');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMethod) {
        await paymentMethodsAPI.update(editingMethod.id.toString(), formData);
        toast.success('Moyen de paiement mis à jour');
      } else {
        await paymentMethodsAPI.create(formData);
        toast.success('Moyen de paiement créé');
      }

      setIsModalOpen(false);
      setEditingMethod(null);
      setFormData({ name: '', code: '', icon: '', description: '' });
      fetchMethods();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      icon: method.icon || '',
      description: method.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce moyen de paiement ?')) return;

    try {
      await paymentMethodsAPI.delete(id.toString());
      toast.success('Moyen de paiement supprimé');
      fetchMethods();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    try {
      await paymentMethodsAPI.update(method.id.toString(), {
        is_active: !method.is_active
      });
      toast.success('Statut mis à jour');
      fetchMethods();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
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
        subtitle="Moyens de paiement"
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
              Moyens de Paiement
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Gérez les moyens de paiement disponibles pour les échanges
            </p>
          </motion.div>

        {/* Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 sm:mb-6"
        >
          <NeonButton
            variant="primary"
            onClick={() => {
              setEditingMethod(null);
              setFormData({ name: '', code: '', icon: '', description: '' });
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Ajouter un moyen de paiement</span>
          </NeonButton>
        </motion.div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {methods.map((method, index) => (
            <GlassCard
              key={method.id}
              glow
              glowColor="green"
              className="p-4 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-3xl sm:text-4xl">{method.icon || '💰'}</div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      {method.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">{method.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(method)}
                  className="transition-transform hover:scale-110 flex-shrink-0"
                >
                  {method.is_active ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emile-green" />
                  ) : (
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emile-red" />
                  )}
                </button>
              </div>

              {method.description && (
                <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">{method.description}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(method)}
                  className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-emile-green/20 hover:bg-emile-green/30 text-emile-green rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Modifier</span>
                  <span className="xs:hidden">Mod.</span>
                </button>
                <button
                  onClick={() => handleDelete(method.id)}
                  className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-emile-red/20 hover:bg-emile-red/30 text-emile-red rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Supprimer</span>
                  <span className="xs:hidden">Supp.</span>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <GlassCard
              className="w-full max-w-md p-4 sm:p-6"
              glow
              glowColor="red"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                {editingMethod ? 'Modifier' : 'Ajouter'} un moyen de paiement
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <AnimatedInput
                  label="Nom"
                  placeholder="Ex: T-Money"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <AnimatedInput
                  label="Code"
                  placeholder="Ex: TMONEY (en majuscules)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />

                <AnimatedInput
                  label="Icône (emoji)"
                  placeholder="Ex: 💰"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />

                <AnimatedInput
                  label="Description"
                  placeholder="Ex: Togocom Mobile Money"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                  <NeonButton
                    type="submit"
                    variant="primary"
                    fullWidth
                  >
                    <span className="text-sm sm:text-base">{editingMethod ? 'Mettre à jour' : 'Créer'}</span>
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
