'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ArrowRight, X } from 'lucide-react';
import { exchangePairsAPI, paymentMethodsAPI } from '@/lib/api';
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
}

interface Field {
  field_name: string;
  field_type: string;
  field_label: string;
  placeholder: string;
  is_required: boolean;
  options?: string[];
}

interface ExchangePair {
  id: number;
  from_method_id: number;
  to_method_id: number;
  from_method_name: string;
  from_method_code: string;
  from_method_icon: string;
  to_method_name: string;
  to_method_code: string;
  to_method_icon: string;
  fee_percentage: number;
  tax_amount: number;
  payment_syntax_type: 'TEXTE' | 'LIEN' | 'AUTRE';
  payment_syntax_value: string;
  is_active: boolean;
  fields: Field[];
}

export default function ExchangePairsPage() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin } = useAuthStore();
  const [pairs, setPairs] = useState<ExchangePair[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<ExchangePair | null>(null);
  const [formData, setFormData] = useState({
    from_method_id: '',
    to_method_id: '',
    fee_percentage: '0',
    tax_amount: '0',
    payment_syntax_type: 'TEXTE' as 'TEXTE' | 'LIEN' | 'AUTRE',
    payment_syntax_value: '',
    fields: [] as Field[]
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchPairs();
    fetchMethods();
  }, [isAuthenticated, isAdmin, router]);

  const fetchPairs = async () => {
    try {
      const response = await exchangePairsAPI.getAll();
      setPairs(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
  };

  const fetchMethods = async () => {
    try {
      const response = await paymentMethodsAPI.getAll(true);
      setMethods(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.from_method_id === formData.to_method_id) {
      toast.error('Les moyens de paiement doivent être différents');
      return;
    }

    try {
      const data = {
        from_method_id: parseInt(formData.from_method_id),
        to_method_id: parseInt(formData.to_method_id),
        fee_percentage: parseFloat(formData.fee_percentage),
        tax_amount: parseFloat(formData.tax_amount),
        payment_syntax_type: formData.payment_syntax_type,
        payment_syntax_value: formData.payment_syntax_value,
        fields: formData.fields
      };

      if (editingPair) {
        await exchangePairsAPI.update(editingPair.id.toString(), {
          fee_percentage: data.fee_percentage,
          tax_amount: data.tax_amount,
          payment_syntax_type: data.payment_syntax_type,
          payment_syntax_value: data.payment_syntax_value,
          fields: data.fields
        });
        toast.success('Paire mise à jour');
      } else {
        await exchangePairsAPI.create(data);
        toast.success('Paire créée');
      }

      setIsModalOpen(false);
      setEditingPair(null);
      resetForm();
      fetchPairs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const resetForm = () => {
    setFormData({
      from_method_id: '',
      to_method_id: '',
      fee_percentage: '0',
      tax_amount: '0',
      payment_syntax_type: 'TEXTE',
      payment_syntax_value: '',
      fields: []
    });
  };

  const handleEdit = (pair: ExchangePair) => {
    setEditingPair(pair);
    setFormData({
      from_method_id: pair.from_method_id.toString(),
      to_method_id: pair.to_method_id.toString(),
      fee_percentage: pair.fee_percentage.toString(),
      tax_amount: pair.tax_amount.toString(),
      payment_syntax_type: pair.payment_syntax_type || 'TEXTE',
      payment_syntax_value: pair.payment_syntax_value || '',
      fields: pair.fields || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette paire d\'échange ?')) return;

    try {
      await exchangePairsAPI.delete(id.toString());
      toast.success('Paire supprimée');
      fetchPairs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [
        ...formData.fields,
        {
          field_name: '',
          field_type: 'text',
          field_label: '',
          placeholder: '',
          is_required: false,
          options: []
        }
      ]
    });
  };

  const updateField = (index: number, updates: Partial<Field>) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index)
    });
  };

  if (!isAuthenticated || !isAdmin || !admin) {
    return null;
  }

  return (
    <>
      {/* Header EMILE TRANSFER+ avec logo */}
      <Header
        title="EMILE TRANSFER"
        subtitle="Paires d'échanges"
        userName={admin.username}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
      />

      <div className="min-h-screen p-3 sm:p-6 relative">
        <div className="cyber-grid" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Paires d'Échanges
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Configurez les échanges possibles avec frais et champs personnalisés
            </p>
          </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 sm:mb-6"
        >
          <NeonButton
            variant="primary"
            onClick={() => {
              setEditingPair(null);
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Créer une paire d'échange</span>
          </NeonButton>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {pairs.map((pair, index) => (
            <GlassCard
              key={pair.id}
              glow
              glowColor="green"
              className="p-4 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl">{pair.from_method_icon}</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-emile-red" />
                  <span className="text-2xl sm:text-3xl">{pair.to_method_icon}</span>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                {pair.from_method_name} → {pair.to_method_name}
              </h3>

              <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">Frais:</span>
                  <span className="text-emile-green font-semibold">
                    {pair.fee_percentage}%
                  </span>
                </div>
                {pair.tax_amount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">Taxe:</span>
                    <span className="text-emile-green font-semibold">
                      {pair.tax_amount} FCFA
                    </span>
                  </div>
                )}
                {pair.fields && pair.fields.length > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">Champs:</span>
                    <span className="text-emile-green font-semibold">
                      {pair.fields.length}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(pair)}
                  className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-emile-green/20 hover:bg-emile-green/30 text-emile-green rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Modifier</span>
                  <span className="xs:hidden">Mod.</span>
                </button>
                <button
                  onClick={() => handleDelete(pair.id)}
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center p-0 sm:p-4 z-50 overflow-y-auto"
            onClick={() => setIsModalOpen(false)}
          >
            <div className="w-full min-h-full sm:min-h-0 flex items-start sm:items-center justify-center pt-20 sm:pt-0 pb-8">
              <GlassCard
                className="w-full max-w-2xl p-4 sm:p-6 my-0 sm:my-8"
                glow
                glowColor="red"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                {editingPair ? 'Modifier' : 'Créer'} une paire d'échange
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {!editingPair && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                        De
                      </label>
                      <select
                        value={formData.from_method_id}
                        onChange={(e) => setFormData({ ...formData, from_method_id: e.target.value })}
                        className="form-input text-sm sm:text-base"
                        required
                      >
                        <option value="">Sélectionner...</option>
                        {methods.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.icon} {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                        Vers
                      </label>
                      <select
                        value={formData.to_method_id}
                        onChange={(e) => setFormData({ ...formData, to_method_id: e.target.value })}
                        className="form-input text-sm sm:text-base"
                        required
                      >
                        <option value="">Sélectionner...</option>
                        {methods.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.icon} {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <AnimatedInput
                    label="Frais (%)"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 2.5"
                    value={formData.fee_percentage}
                    onChange={(e) => setFormData({ ...formData, fee_percentage: e.target.value })}
                  />

                  <AnimatedInput
                    label="Taxe (FCFA)"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Ex: 100"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                  />
                </div>

                {/* Syntaxe de Paiement */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Type de Syntaxe de Paiement
                    </label>
                    <select
                      value={formData.payment_syntax_type}
                      onChange={(e) => setFormData({ ...formData, payment_syntax_type: e.target.value as 'TEXTE' | 'LIEN' | 'AUTRE' })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-emile-red focus:outline-none text-sm sm:text-base"
                    >
                      <option value="TEXTE">Texte (avec variable {'{montant}'})</option>
                      <option value="LIEN">Lien URL</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Le type détermine comment les instructions de paiement seront affichées au client
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      {formData.payment_syntax_type === 'TEXTE' && 'Syntaxe (utilisez {montant} pour le montant total)'}
                      {formData.payment_syntax_type === 'LIEN' && 'URL de paiement'}
                      {formData.payment_syntax_type === 'AUTRE' && 'Instructions personnalisées'}
                    </label>
                    <textarea
                      value={formData.payment_syntax_value}
                      onChange={(e) => setFormData({ ...formData, payment_syntax_value: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-emile-red focus:outline-none resize-none text-sm sm:text-base"
                      rows={3}
                      placeholder={
                        formData.payment_syntax_type === 'TEXTE'
                          ? 'Ex: Composez *123*{montant}# puis envoyez le code reçu'
                          : formData.payment_syntax_type === 'LIEN'
                          ? 'Ex: https://paiement.exemple.com/pay'
                          : 'Instructions personnalisées'
                      }
                    />
                    {formData.payment_syntax_type === 'TEXTE' && (
                      <p className="text-xs text-green-500 mt-1">
                        La variable {'{montant}'} sera automatiquement remplacée par le montant total (montant + frais + taxe)
                      </p>
                    )}
                  </div>
                </div>

                <div className="neon-divider my-4 sm:my-6" />

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      Champs personnalisés
                    </h3>
                    <NeonButton
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={addField}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Ajouter un champ</span>
                    </NeonButton>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {formData.fields.map((field, index) => (
                      <GlassCard key={index} className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-xs sm:text-sm font-medium text-emile-green">
                            Champ #{index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="text-emile-red hover:text-red-300"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <AnimatedInput
                            label="Nom technique"
                            placeholder="Ex: phone_number"
                            value={field.field_name}
                            onChange={(e) => updateField(index, { field_name: e.target.value })}
                            required
                          />

                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                              Type
                            </label>
                            <select
                              value={field.field_type}
                              onChange={(e) => updateField(index, { field_type: e.target.value })}
                              className="form-input text-sm sm:text-base"
                            >
                              <option value="text">Texte</option>
                              <option value="url">URL/Lien</option>
                              <option value="file">Fichier</option>
                              <option value="select">Sélection</option>
                            </select>
                          </div>

                          <AnimatedInput
                            label="Label"
                            placeholder="Ex: Numéro de téléphone"
                            value={field.field_label}
                            onChange={(e) => updateField(index, { field_label: e.target.value })}
                            required
                          />

                          <AnimatedInput
                            label="Placeholder"
                            placeholder="Ex: 90 00 00 00"
                            value={field.placeholder}
                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          />
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={field.is_required}
                            onChange={(e) => updateField(index, { is_required: e.target.checked })}
                            className="rounded"
                          />
                          <label htmlFor={`required-${index}`} className="text-xs sm:text-sm text-gray-300">
                            Champ requis
                          </label>
                        </div>

                        {field.field_type === 'select' && (
                          <AnimatedInput
                            label="Options (séparées par des virgules)"
                            placeholder="Option1, Option2, Option3"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) =>
                              updateField(index, {
                                options: e.target.value.split(',').map((o) => o.trim())
                              })
                            }
                          />
                        )}
                      </GlassCard>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                  <NeonButton type="submit" variant="primary" fullWidth>
                    <span className="text-sm sm:text-base">{editingPair ? 'Mettre à jour' : 'Créer'}</span>
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
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
