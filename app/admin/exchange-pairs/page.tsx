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
  validated_email_template_id?: number;
  rejected_email_template_id?: number;
  is_active: boolean;
  fields: Field[];
}

interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  description: string;
}

export default function ExchangePairsPage() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin } = useAuthStore();
  const [pairs, setPairs] = useState<ExchangePair[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<ExchangePair | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    from_method_id: '',
    to_method_id: '',
    fee_percentage: '0',
    tax_amount: '0',
    min_amount: '500',
    max_amount: '500000',
    payment_syntax_type: 'TEXTE' as 'TEXTE' | 'LIEN' | 'AUTRE',
    payment_syntax_value: '',
    category: '',
    requires_additional_info: false,
    instruction_title: '',
    instruction_content: '',
    instruction_link_url: '',
    instruction_link_text: '',
    // Configuration des champs du formulaire client
    from_number_label: '',
    from_number_placeholder: '',
    to_number_label: '',
    to_number_placeholder: '',
    show_to_number: true,
    amount_label: 'Montant',
    amount_placeholder: '',
    reference_required: true,
    reference_label: 'Référence de paiement',
    reference_placeholder: 'Ex: TM123456789',
    validated_email_template_id: '',
    rejected_email_template_id: '',
    fields: [] as Field[]
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchPairs();
    fetchMethods();
    fetchEmailTemplates();
  }, [isAuthenticated, isAdmin, router]);

  // Réinitialiser les champs de configuration du formulaire si la catégorie n'est plus "subscription"
  useEffect(() => {
    if (formData.category !== 'subscription') {
      setFormData(prev => ({
        ...prev,
        from_number_label: '',
        from_number_placeholder: '',
        to_number_label: '',
        to_number_placeholder: '',
        show_to_number: true,
        amount_label: 'Montant',
        amount_placeholder: '',
        reference_required: true,
        reference_label: 'Référence de paiement',
        reference_placeholder: 'Ex: TM123456789'
      }));
    }
  }, [formData.category]);

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

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-templates`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEmailTemplates(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation détaillée
    const errors: string[] = [];

    if (!formData.from_method_id) {
      errors.push('Veuillez sélectionner le moyen de paiement source');
    }

    if (!formData.to_method_id) {
      errors.push('Veuillez sélectionner le moyen de paiement destination');
    }

    if (formData.from_method_id === formData.to_method_id) {
      errors.push('Les moyens de paiement source et destination doivent être différents');
    }

    if (!formData.min_amount || parseFloat(formData.min_amount) < 0) {
      errors.push('Le montant minimum doit être supérieur ou égal à 0');
    }

    if (!formData.max_amount || parseFloat(formData.max_amount) < 0) {
      errors.push('Le montant maximum doit être supérieur ou égal à 0');
    }

    if (parseFloat(formData.min_amount) > parseFloat(formData.max_amount)) {
      errors.push('Le montant minimum ne peut pas être supérieur au montant maximum');
    }

    if (parseFloat(formData.fee_percentage) < 0) {
      errors.push('Le pourcentage de frais doit être supérieur ou égal à 0');
    }

    if (parseFloat(formData.tax_amount) < 0) {
      errors.push('Le montant de la taxe doit être supérieur ou égal à 0');
    }

    if (!formData.validated_email_template_id) {
      errors.push('Veuillez sélectionner un template d\'email pour la validation');
    }

    if (!formData.rejected_email_template_id) {
      errors.push('Veuillez sélectionner un template d\'email pour le rejet');
    }

    // Validation des champs personnalisés
    formData.fields.forEach((field, index) => {
      if (!field.field_name) {
        errors.push(`Champ #${index + 1}: Le nom technique est requis`);
      }
      if (!field.field_label) {
        errors.push(`Champ #${index + 1}: Le label est requis`);
      }
      if (field.field_type === 'select' && (!field.options || field.options.length === 0)) {
        errors.push(`Champ #${index + 1}: Les options sont requises pour un champ de type sélection`);
      }
    });

    // Si des erreurs, afficher et arrêter
    if (errors.length > 0) {
      toast.error(
        <div>
          <p className="font-bold mb-2">❌ Erreurs de validation:</p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>,
        { duration: 6000 }
      );
      return;
    }

    try {
      const data = {
        from_method_id: parseInt(formData.from_method_id),
        to_method_id: parseInt(formData.to_method_id),
        fee_percentage: parseFloat(formData.fee_percentage),
        tax_amount: parseFloat(formData.tax_amount),
        min_amount: parseFloat(formData.min_amount),
        max_amount: parseFloat(formData.max_amount),
        payment_syntax_type: formData.payment_syntax_type,
        payment_syntax_value: formData.payment_syntax_value,
        category: formData.category || null,
        requires_additional_info: formData.requires_additional_info,
        instruction_title: formData.instruction_title || null,
        instruction_content: formData.instruction_content || null,
        instruction_link_url: formData.instruction_link_url || null,
        instruction_link_text: formData.instruction_link_text || null,
        from_number_label: formData.from_number_label || null,
        from_number_placeholder: formData.from_number_placeholder || null,
        to_number_label: formData.to_number_label || null,
        to_number_placeholder: formData.to_number_placeholder || null,
        show_to_number: formData.show_to_number,
        amount_label: formData.amount_label || 'Montant',
        amount_placeholder: formData.amount_placeholder || null,
        reference_required: formData.reference_required,
        reference_label: formData.reference_label || 'Référence de paiement',
        reference_placeholder: formData.reference_placeholder || null,
        fields: formData.fields
      };

      if (editingPair) {
        await exchangePairsAPI.update(editingPair.id.toString(), {
          fee_percentage: data.fee_percentage,
          tax_amount: data.tax_amount,
          min_amount: data.min_amount,
          max_amount: data.max_amount,
          payment_syntax_type: data.payment_syntax_type,
          payment_syntax_value: data.payment_syntax_value,
          category: data.category,
          requires_additional_info: data.requires_additional_info,
          instruction_title: data.instruction_title,
          instruction_content: data.instruction_content,
          instruction_link_url: data.instruction_link_url,
          instruction_link_text: data.instruction_link_text,
          from_number_label: data.from_number_label,
          from_number_placeholder: data.from_number_placeholder,
          to_number_label: data.to_number_label,
          to_number_placeholder: data.to_number_placeholder,
          show_to_number: data.show_to_number,
          amount_label: data.amount_label,
          amount_placeholder: data.amount_placeholder,
          reference_required: data.reference_required,
          reference_label: data.reference_label,
          reference_placeholder: data.reference_placeholder,
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
      // Affichage détaillé des erreurs du backend
      const backendErrors = error.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        toast.error(
          <div>
            <p className="font-bold mb-2">❌ Erreurs du serveur:</p>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              {backendErrors.map((err: any, i: number) => (
                <li key={i}>{err.msg || err.message || JSON.stringify(err)}</li>
              ))}
            </ul>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(error.response?.data?.message || 'Une erreur est survenue lors de la création/modification');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      from_method_id: '',
      to_method_id: '',
      fee_percentage: '0',
      tax_amount: '0',
      min_amount: '500',
      max_amount: '500000',
      payment_syntax_type: 'TEXTE',
      payment_syntax_value: '',
      category: '',
      requires_additional_info: false,
      instruction_title: '',
      instruction_content: '',
      instruction_link_url: '',
      instruction_link_text: '',
      from_number_label: '',
      from_number_placeholder: '',
      to_number_label: '',
      to_number_placeholder: '',
      show_to_number: true,
      amount_label: 'Montant',
      amount_placeholder: '',
      reference_required: true,
      reference_label: 'Référence de paiement',
      reference_placeholder: 'Ex: TM123456789',
      validated_email_template_id: '',
      rejected_email_template_id: '',
      fields: []
    });
    setCurrentStep(1);
  };

  const handleEdit = (pair: ExchangePair) => {
    setEditingPair(pair);
    setFormData({
      from_method_id: pair.from_method_id.toString(),
      to_method_id: pair.to_method_id.toString(),
      fee_percentage: pair.fee_percentage.toString(),
      tax_amount: pair.tax_amount.toString(),
      min_amount: pair.min_amount?.toString() || '500',
      max_amount: pair.max_amount?.toString() || '500000',
      payment_syntax_type: pair.payment_syntax_type || 'TEXTE',
      payment_syntax_value: pair.payment_syntax_value || '',
      category: pair.category || '',
      requires_additional_info: pair.requires_additional_info || false,
      instruction_title: pair.instruction_title || '',
      instruction_content: pair.instruction_content || '',
      instruction_link_url: pair.instruction_link_url || '',
      instruction_link_text: pair.instruction_link_text || '',
      from_number_label: pair.from_number_label || '',
      from_number_placeholder: pair.from_number_placeholder || '',
      to_number_label: pair.to_number_label || '',
      to_number_placeholder: pair.to_number_placeholder || '',
      show_to_number: pair.show_to_number !== undefined ? pair.show_to_number : true,
      amount_label: pair.amount_label || 'Montant',
      amount_placeholder: pair.amount_placeholder || '',
      reference_required: pair.reference_required !== undefined ? pair.reference_required : true,
      reference_label: pair.reference_label || 'Référence de paiement',
      reference_placeholder: pair.reference_placeholder || 'Ex: TM123456789',
      validated_email_template_id: pair.validated_email_template_id?.toString() || '',
      rejected_email_template_id: pair.rejected_email_template_id?.toString() || '',
      fields: pair.fields || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      '⚠️ ATTENTION\n\n' +
      'Voulez-vous vraiment supprimer cette paire d\'échange ?\n\n' +
      'Cette action est IRRÉVERSIBLE et échouera si des transactions utilisent déjà cette paire.\n\n' +
      '💡 Conseil : Désactivez plutôt la paire si vous souhaitez simplement la masquer aux clients.'
    );

    if (!confirmed) return;

    try {
      await exchangePairsAPI.delete(id.toString());
      toast.success('✅ Paire d\'échange supprimée avec succès');
      fetchPairs();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la suppression';
      const transactionCount = error.response?.data?.transactionCount;

      if (transactionCount) {
        toast.error(
          <div className="space-y-2">
            <p className="font-bold text-base">❌ Suppression impossible</p>
            <p className="text-sm">{message}</p>
            <p className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-600">
              💡 <strong>Conseil :</strong> Utilisez le bouton d'activation/désactivation pour masquer cette paire aux clients sans perdre l'historique des transactions.
            </p>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(message);
      }
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

  const nextStep = () => {
    // Validation selon le step
    if (currentStep === 1) {
      if (!formData.from_method_id || !formData.to_method_id) {
        toast.error('Veuillez sélectionner les moyens de paiement');
        return;
      }
      if (formData.from_method_id === formData.to_method_id) {
        toast.error('Les moyens de paiement doivent être différents');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const canGoNext = () => {
    if (currentStep === 1) {
      return formData.from_method_id && formData.to_method_id;
    }
    return true;
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

              {/* Badges catégorie */}
              {pair.category && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                    {pair.category === 'money_exchange' && '💰 Échange'}
                    {pair.category === 'credit' && '📱 Crédit'}
                    {pair.category === 'subscription' && '📺 Abonnement'}
                    {pair.category === 'purchase' && '⚡ Achat'}
                    {pair.category === 'bank_service' && '🏦 Banque'}
                  </span>
                </div>
              )}

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
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">Montants:</span>
                  <span className="text-emile-blue font-semibold">
                    {pair.min_amount || 500} - {pair.max_amount || 500000} FCFA
                  </span>
                </div>
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
        </div>

        {/* Modal */}
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center p-0 sm:p-4 z-50 overflow-y-auto"
            onClick={() => setIsModalOpen(false)}
          >
            <div className="w-full min-h-full sm:min-h-0 flex items-start sm:items-center justify-center pt-40 sm:pt-0 pb-8">
              <GlassCard
                className="w-full max-w-2xl p-4 sm:p-6 my-0 sm:my-8"
                glow
                glowColor="red"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                {editingPair ? 'Modifier' : 'Créer'} une paire d'échange
              </h2>

              {/* Stepper - Mobile only */}
              <div className="sm:hidden mb-6">
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex-1 flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step === currentStep
                          ? 'bg-cyan-500 text-white'
                          : step < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && (
                        <div className={`flex-1 h-1 mx-1 ${
                          step < currentStep ? 'bg-green-500' : 'bg-gray-700'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center text-gray-400">
                  {currentStep === 1 && 'Catégorie et sélection des paires'}
                  {currentStep === 2 && 'Frais, taxes et montants'}
                  {currentStep === 3 && 'Syntaxe de paiement et configuration'}
                  {currentStep === 4 && 'Champs personnalisés'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Step 1: Sélection des paires */}
                <div className={`${currentStep !== 1 ? 'hidden sm:block' : ''}`}>
                  <div className="space-y-4">
                    {/* Catégorie de Service - TOUJOURS VISIBLE */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Catégorie de Service
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-emile-red focus:outline-none text-sm sm:text-base"
                      >
                        <option value="" className="bg-gray-900 text-white">Aucune (par défaut)</option>
                        <option value="money_exchange" className="bg-gray-900 text-white">💰 Échange d'argent</option>
                        <option value="credit" className="bg-gray-900 text-white">📱 Crédit de communication</option>
                        <option value="subscription" className="bg-gray-900 text-white">📺 Abonnement</option>
                        <option value="purchase" className="bg-gray-900 text-white">⚡ Achat (électricité, eau, etc.)</option>
                        <option value="bank_service" className="bg-gray-900 text-white">🏦 Service bancaire</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Permet de catégoriser le type de service
                      </p>
                    </div>

                    {/* Sélection des méthodes */}
                    {!editingPair ? (
                      // Mode création : sélection des méthodes
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                            De <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={formData.from_method_id}
                            onChange={(e) => setFormData({ ...formData, from_method_id: e.target.value })}
                            className="form-input text-sm sm:text-base"
                            required
                          >
                            <option value="" className="bg-gray-900 text-white">Sélectionner...</option>
                            {methods.map((m) => (
                              <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                                {m.icon} {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                            Vers <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={formData.to_method_id}
                            onChange={(e) => setFormData({ ...formData, to_method_id: e.target.value })}
                            className="form-input text-sm sm:text-base"
                            required
                          >
                            <option value="" className="bg-gray-900 text-white">Sélectionner...</option>
                            {methods.map((m) => (
                              <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                                {m.icon} {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      // Mode édition : affichage des méthodes (non modifiables)
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Paire d'échange :</p>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{methods.find(m => m.id === parseInt(formData.from_method_id))?.icon}</span>
                          <span className="text-white font-semibold">
                            {methods.find(m => m.id === parseInt(formData.from_method_id))?.name}
                          </span>
                          <ArrowRight className="w-5 h-5 text-emile-red" />
                          <span className="text-2xl">{methods.find(m => m.id === parseInt(formData.to_method_id))?.icon}</span>
                          <span className="text-white font-semibold">
                            {methods.find(m => m.id === parseInt(formData.to_method_id))?.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Les méthodes de paiement ne peuvent pas être modifiées après création
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Frais, taxes et montants */}
                <div className={`${currentStep !== 2 ? 'hidden sm:block' : ''} space-y-4`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <AnimatedInput
                      label="Pourcentage de frais (%)"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <AnimatedInput
                      label="Montant minimum (FCFA)"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Ex: 500"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                      required
                    />

                    <AnimatedInput
                      label="Montant maximum (FCFA)"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Ex: 500000"
                      value={formData.max_amount}
                      onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                      required
                    />
                  </div>

                  {/* Templates d'email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Template Email Validation <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.validated_email_template_id}
                        onChange={(e) => setFormData({ ...formData, validated_email_template_id: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-emile-green focus:outline-none text-sm sm:text-base"
                        required
                      >
                        <option value="">Sélectionner un template</option>
                        {emailTemplates.map((template) => (
                          <option key={template.id} value={template.id} className="bg-gray-900 text-white">
                            {template.subject} ({template.type})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Email envoyé lors de la validation</p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Template Email Rejet <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.rejected_email_template_id}
                        onChange={(e) => setFormData({ ...formData, rejected_email_template_id: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-emile-red focus:outline-none text-sm sm:text-base"
                        required
                      >
                        <option value="">Sélectionner un template</option>
                        {emailTemplates.map((template) => (
                          <option key={template.id} value={template.id} className="bg-gray-900 text-white">
                            {template.subject} ({template.type})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Email envoyé lors du rejet</p>
                    </div>
                  </div>
                </div>

                {/* Step 3: Syntaxe de Paiement */}
                <div className={`${currentStep !== 3 ? 'hidden sm:block' : ''}`}>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {/* Type de Syntaxe de Paiement */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Type de Syntaxe de Paiement
                    </label>
                    <select
                      value={formData.payment_syntax_type}
                      onChange={(e) => setFormData({ ...formData, payment_syntax_type: e.target.value as 'TEXTE' | 'LIEN' | 'AUTRE' })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-emile-red focus:outline-none text-sm sm:text-base"
                    >
                      <option value="TEXTE" className="bg-gray-900 text-white">Texte (avec variable {'{montant}'})</option>
                      <option value="LIEN" className="bg-gray-900 text-white">Lien URL</option>
                      <option value="AUTRE" className="bg-gray-900 text-white">Autre</option>
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

                  {/* Section Configuration */}
                  <div className="mt-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                      <input
                        type="checkbox"
                        id="requires_additional_info"
                        checked={formData.requires_additional_info}
                        onChange={(e) => setFormData({ ...formData, requires_additional_info: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="requires_additional_info" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
                        <div className="font-semibold text-yellow-400">Infos additionnelles requises</div>
                        <div className="text-xs text-gray-500">Client doit fournir des infos après paiement</div>
                      </label>
                    </div>
                  </div>

                  {/* Indication pour la configuration du formulaire client */}
                  {formData.category && formData.category !== 'subscription' && (
                    <div className="mt-6 p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        La configuration avancée du formulaire client n'est disponible que pour la catégorie <strong className="text-white mx-1">📺 Abonnements</strong>
                      </p>
                    </div>
                  )}

                  {/* Configuration du formulaire client - Uniquement pour les abonnements */}
                  {formData.category === 'subscription' && (
                  <div className="mt-6 p-4 sm:p-5 bg-purple-900/20 border-2 border-purple-500/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-purple-400 mb-4">⚙️ Configuration du formulaire client (Abonnements uniquement)</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AnimatedInput
                          label="Label du champ source"
                          placeholder="Ex: Numéro TDE, Numéro de compteur"
                          value={formData.from_number_label}
                          onChange={(e) => setFormData({ ...formData, from_number_label: e.target.value })}
                        />

                        <AnimatedInput
                          label="Placeholder du champ source"
                          placeholder="Ex: 12345678"
                          value={formData.from_number_placeholder}
                          onChange={(e) => setFormData({ ...formData, from_number_placeholder: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                        <input
                          type="checkbox"
                          id="show_to_number"
                          checked={formData.show_to_number}
                          onChange={(e) => setFormData({ ...formData, show_to_number: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="show_to_number" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
                          <div className="font-semibold">Afficher le champ destination</div>
                          <div className="text-xs text-gray-500">Décocher pour les abonnements qui n'ont besoin que d'un numéro</div>
                        </label>
                      </div>

                      {formData.show_to_number && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <AnimatedInput
                            label="Label du champ destination"
                            placeholder="Ex: Numéro destinataire"
                            value={formData.to_number_label}
                            onChange={(e) => setFormData({ ...formData, to_number_label: e.target.value })}
                          />

                          <AnimatedInput
                            label="Placeholder du champ destination"
                            placeholder="Ex: 90 00 00 00"
                            value={formData.to_number_placeholder}
                            onChange={(e) => setFormData({ ...formData, to_number_placeholder: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AnimatedInput
                          label="Label du montant"
                          placeholder="Ex: Montant à recharger"
                          value={formData.amount_label}
                          onChange={(e) => setFormData({ ...formData, amount_label: e.target.value })}
                        />

                        <AnimatedInput
                          label="Placeholder du montant"
                          placeholder="Ex: 5000"
                          value={formData.amount_placeholder}
                          onChange={(e) => setFormData({ ...formData, amount_placeholder: e.target.value })}
                        />
                      </div>

                      <div className="neon-divider my-3" />

                      <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                        <input
                          type="checkbox"
                          id="reference_required"
                          checked={formData.reference_required}
                          onChange={(e) => setFormData({ ...formData, reference_required: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="reference_required" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
                          <div className="font-semibold">Référence de paiement requise</div>
                          <div className="text-xs text-gray-500">Si coché, le client devra fournir une référence</div>
                        </label>
                      </div>

                      {formData.reference_required && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <AnimatedInput
                            label="Label de la référence"
                            placeholder="Ex: Code de transaction"
                            value={formData.reference_label}
                            onChange={(e) => setFormData({ ...formData, reference_label: e.target.value })}
                          />

                          <AnimatedInput
                            label="Placeholder de la référence"
                            placeholder="Ex: TM123456789"
                            value={formData.reference_placeholder}
                            onChange={(e) => setFormData({ ...formData, reference_placeholder: e.target.value })}
                          />
                        </div>
                      )}

                      <p className="text-xs text-purple-400 mt-3">
                        ℹ️ Ces paramètres permettent de personnaliser le formulaire que verra le client selon le type de service
                      </p>
                    </div>
                  </div>
                  )}

                  {/* Section Instructions pour le client */}
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3">📋 Instructions pour le client (optionnel)</h4>
                    <div className="space-y-3">
                      <AnimatedInput
                        label="Titre des instructions"
                        placeholder="Ex: Comment générer un code Ecobank?"
                        value={formData.instruction_title}
                        onChange={(e) => setFormData({ ...formData, instruction_title: e.target.value })}
                      />

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                          Contenu des instructions
                        </label>
                        <textarea
                          value={formData.instruction_content}
                          onChange={(e) => setFormData({ ...formData, instruction_content: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-emile-red focus:outline-none resize-none text-sm sm:text-base"
                          rows={4}
                          placeholder="Ex: 1. Ouvrez l'app Ecobank Mobile&#10;2. Allez dans 'Retrait sans carte'&#10;3. Générez un code..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AnimatedInput
                          label="URL du lien (optionnel)"
                          type="url"
                          placeholder="https://example.com/guide"
                          value={formData.instruction_link_url}
                          onChange={(e) => setFormData({ ...formData, instruction_link_url: e.target.value })}
                        />

                        <AnimatedInput
                          label="Texte du lien"
                          placeholder="Ex: Télécharger l'app"
                          value={formData.instruction_link_text}
                          onChange={(e) => setFormData({ ...formData, instruction_link_text: e.target.value })}
                        />
                      </div>

                      <p className="text-xs text-blue-400">
                        Ces instructions seront affichées au client avant de créer la transaction
                      </p>
                    </div>
                  </div>
                </div>
                </div>

                <div className="neon-divider my-4 sm:my-6 hidden sm:block" />

                {/* Step 4: Champs personnalisés */}
                <div className={`${currentStep !== 4 ? 'hidden sm:block' : ''}`}>
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
                              <option value="text" className="bg-gray-900 text-white">Texte</option>
                              <option value="url" className="bg-gray-900 text-white">URL/Lien</option>
                              <option value="file" className="bg-gray-900 text-white">Fichier</option>
                              <option value="select" className="bg-gray-900 text-white">Sélection</option>
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

                {/* Navigation buttons - Mobile with steps */}
                <div className="sm:hidden flex gap-3 mt-6">
                  {currentStep > 1 && (
                    <NeonButton
                      type="button"
                      variant="secondary"
                      fullWidth
                      onClick={prevStep}
                    >
                      <span className="text-sm">← Précédent</span>
                    </NeonButton>
                  )}
                  {currentStep < 4 ? (
                    <NeonButton
                      type="button"
                      variant="primary"
                      fullWidth
                      onClick={nextStep}
                      disabled={!canGoNext()}
                    >
                      <span className="text-sm">Suivant →</span>
                    </NeonButton>
                  ) : (
                    <NeonButton type="submit" variant="primary" fullWidth>
                      <span className="text-sm">{editingPair ? 'Mettre à jour' : 'Créer'}</span>
                    </NeonButton>
                  )}
                </div>

                {/* Standard buttons - Desktop (no steps) */}
                <div className="hidden sm:flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
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
