'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Mail, Bell, Eye, Edit, Save, X,
  Check, AlertCircle, FileText, MessageSquare, Send
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/lib/store';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  html_body: string;
  text_body: string | null;
  notification_title: string;
  notification_body: string;
  variables: string | null;
  description: string | null;
  is_active: boolean;
}

interface ConfigItem {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'emails' | 'general'>('emails');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const [editForm, setEditForm] = useState({
    subject: '',
    notification_title: '',
    notification_body: '',
    html_body: '',
    text_body: '',
    is_active: true
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
    } else {
      loadTemplates();
      loadConfigs();
    }
  }, [isAuthenticated, isAdmin, router]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-templates`,
        {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
        }
      );

      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings/config`,
        {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
        }
      );

      if (response.data.success) {
        const configsData = response.data.configs;
        setConfigs(configsData);

        // Initialiser les valeurs modifiables
        const values: Record<string, string> = {};
        configsData.forEach((config: ConfigItem) => {
          values[config.key] = config.value;
        });
        setConfigValues(values);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des configurations:', error);
      toast.error('Erreur lors du chargement des configurations');
    }
  };

  const handleSaveConfig = async (key: string) => {
    try {
      setSaving(true);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings/config/${key}`,
        { value: configValues[key] },
        {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
        }
      );

      toast.success('Configuration mise à jour avec succès');
      setEditingConfig(null);
      loadConfigs();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      subject: template.subject,
      notification_title: template.notification_title || '',
      notification_body: template.notification_body || '',
      html_body: template.html_body,
      text_body: template.text_body || '',
      is_active: template.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-templates/${selectedTemplate.id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
        }
      );

      toast.success('Template mis à jour avec succès');
      setIsEditModalOpen(false);
      loadTemplates();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'transaction_validated':
        return '✅';
      case 'transaction_rejected':
        return '❌';
      case 'kyc_validated':
        return '🎉';
      case 'kyc_rejected':
        return '⚠️';
      default:
        return '📧';
    }
  };

  const getTemplateColor = (type: string) => {
    switch (type) {
      case 'transaction_validated':
        return 'from-green-500 to-emerald-600';
      case 'transaction_rejected':
        return 'from-red-500 to-rose-600';
      case 'kyc_validated':
        return 'from-purple-500 to-indigo-600';
      case 'kyc_rejected':
        return 'from-orange-500 to-amber-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTemplateName = (type: string) => {
    const names: Record<string, string> = {
      'transaction_validated': 'Transaction Validée',
      'transaction_rejected': 'Transaction Rejetée',
      'kyc_validated': 'KYC Validé',
      'kyc_rejected': 'KYC Rejeté'
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header
          title="Paramètres"
          userName={admin?.username}
          onLogout={logoutAdmin}
          showAdminNav={true}
        />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-white text-xl">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header
        title="Paramètres"
        userName={admin?.username}
        onLogout={logoutAdmin}
        showAdminNav={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Paramètres de l'Application</h1>
          </div>
          <p className="text-gray-400">Gérez les paramètres globaux et les templates de communication</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'emails'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Mail className="w-5 h-5" />
            Templates Emails & Notifications
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'general'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Settings className="w-5 h-5" />
            Paramètres Généraux
          </button>
        </div>

        {/* Content */}
        {activeTab === 'emails' && (
          <div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-blue-300 font-semibold mb-1">Templates unifiés</h3>
                  <p className="text-blue-200 text-sm">
                    Chaque template définit à la fois le contenu de l'<strong>email</strong> et de la <strong>notification push</strong>
                    que les utilisateurs recevront. Modifiez-les pour personnaliser votre communication.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all"
                >
                  {/* Header avec gradient */}
                  <div className={`bg-gradient-to-r ${getTemplateColor(template.type)} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getTemplateIcon(template.type)}</span>
                        <div>
                          <h3 className="text-white font-bold text-lg">{getTemplateName(template.type)}</h3>
                          <p className="text-white/80 text-sm">{template.description}</p>
                        </div>
                      </div>
                      {template.is_active ? (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                          Actif
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white/60 text-xs font-semibold">
                          Inactif
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {/* Email Preview */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-semibold text-gray-300">Email</span>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                        <p className="text-white font-medium text-sm mb-1">{template.subject}</p>
                        <p className="text-gray-400 text-xs line-clamp-2">
                          {template.text_body || 'Template HTML uniquement'}
                        </p>
                      </div>
                    </div>

                    {/* Notification Preview */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-gray-300">Notification Push</span>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                        <p className="text-white font-medium text-sm mb-1">
                          {template.notification_title || template.subject}
                        </p>
                        <p className="text-gray-400 text-xs line-clamp-2">
                          {template.notification_body || 'Notification non configurée'}
                        </p>
                      </div>
                    </div>

                    {/* Variables */}
                    {template.variables && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Variables disponibles :</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.split(',').map((variable, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded"
                            >
                              {variable.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsPreviewModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all border border-blue-500/30"
                      >
                        <Eye className="w-4 h-4" />
                        Aperçu
                      </button>
                      <button
                        onClick={() => openEditModal(template)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-all border border-cyan-500/30"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-4">
            {configs
              .filter(config => {
                // Filtrer les configurations à ne pas afficher
                const hiddenKeys = ['commission_percentage', 'max_amount', 'min_amount'];
                return !hiddenKeys.includes(config.key);
              })
              .map((config) => {
              const isMonthlyLimit = config.key === 'monthly_limit_without_kyc' || config.key === 'monthly_limit_with_kyc';
              const isEditing = editingConfig === config.key;

              const isWithKyc = config.key === 'monthly_limit_with_kyc';
              const borderColor = isMonthlyLimit
                ? (isWithKyc ? 'border-green-500/50 bg-gradient-to-r from-green-900/10 to-emerald-900/10' : 'border-yellow-500/50 bg-gradient-to-r from-yellow-900/10 to-orange-900/10')
                : 'border-gray-700 hover:border-cyan-500/50';
              const titleColor = isMonthlyLimit
                ? (isWithKyc ? 'text-green-400' : 'text-yellow-400')
                : 'text-white';

              return (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gray-800/50 backdrop-blur-sm border rounded-xl p-6 transition-all ${borderColor}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isMonthlyLimit && (
                          <span className="text-2xl">{isWithKyc ? '✅' : '🔒'}</span>
                        )}
                        <h3 className={`text-lg font-semibold ${titleColor}`}>
                          {config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                      </div>
                      {config.description && (
                        <p className="text-sm text-gray-400 mb-3">{config.description}</p>
                      )}

                      {isEditing ? (
                        <div className="flex items-center gap-3 mt-3">
                          <input
                            type="number"
                            value={configValues[config.key] || ''}
                            onChange={(e) => setConfigValues({
                              ...configValues,
                              [config.key]: e.target.value
                            })}
                            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            placeholder="Entrez la valeur"
                          />
                          <button
                            onClick={() => handleSaveConfig(config.key)}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingConfig(null);
                              // Réinitialiser la valeur
                              setConfigValues({
                                ...configValues,
                                [config.key]: config.value
                              });
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-3">
                          <div className="px-4 py-2 bg-gray-900/50 rounded-lg">
                            <span className="text-2xl font-bold text-cyan-400">
                              {Number(config.value).toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 ml-2">
                              {config.key.includes('amount') || config.key.includes('limit') ? 'FCFA' : ''}
                              {config.key.includes('percentage') ? '%' : ''}
                            </span>
                          </div>
                        </div>
                      )}

                      {isMonthlyLimit && !isEditing && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-xs text-blue-300">
                            💡 {isWithKyc
                              ? 'Cette limite s\'applique aux utilisateurs avec KYC validé.'
                              : 'Cette limite s\'applique aux utilisateurs sans KYC validé. Ils peuvent augmenter leur limite en validant leur KYC.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => setEditingConfig(config.key)}
                        className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                    Dernière modification: {new Date(config.updated_at).toLocaleString('fr-FR')}
                  </div>
                </motion.div>
              );
            })}

            {configs.length === 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <p className="text-gray-400 text-center py-8">
                  Aucune configuration disponible
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      <AnimatePresence>
        {isEditModalOpen && selectedTemplate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className={`sticky top-0 bg-gradient-to-r ${getTemplateColor(selectedTemplate.type)} p-6 flex items-center justify-between z-10`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getTemplateIcon(selectedTemplate.type)}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Modifier le Template</h2>
                    <p className="text-white/80 text-sm">{getTemplateName(selectedTemplate.type)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Section Email */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
                    <Mail className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">Configuration Email</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sujet de l'email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.subject}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      placeholder="Ex: ✅ Transaction validée - EMB Transfer+"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contenu texte (version simple)
                    </label>
                    <textarea
                      value={editForm.text_body}
                      onChange={(e) => setEditForm({ ...editForm, text_body: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      rows={6}
                      placeholder="Version texte brut de l'email..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contenu HTML (version stylée) <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={editForm.html_body}
                      onChange={(e) => setEditForm({ ...editForm, html_body: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                      rows={10}
                      placeholder="Contenu HTML de l'email..."
                    />
                  </div>
                </div>

                {/* Section Notification */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
                    <Bell className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Configuration Notification Push</h3>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-purple-200 text-sm">
                          Les notifications push s'affichent sur les téléphones et dans le navigateur.
                          Gardez-les <strong>courtes et concises</strong> pour une meilleure lisibilité.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre de la notification <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.notification_title}
                      onChange={(e) => setEditForm({ ...editForm, notification_title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ex: Transaction validée !"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editForm.notification_title.length}/50 caractères
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message de la notification <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={editForm.notification_body}
                      onChange={(e) => setEditForm({ ...editForm, notification_body: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      rows={3}
                      placeholder="Ex: Votre transaction de {{amount}} FCFA a été validée avec succès."
                      maxLength={150}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editForm.notification_body.length}/150 caractères
                    </p>
                  </div>

                  {/* Preview notification */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Aperçu de la notification :</p>
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-lg">{getTemplateIcon(selectedTemplate.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-semibold text-sm">
                            {editForm.notification_title || 'Titre de la notification'}
                          </p>
                          <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
                            {editForm.notification_body || 'Corps de la notification'}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">À l'instant • EMB Transfer+</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statut */}
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div>
                    <p className="text-white font-medium">Activer ce template</p>
                    <p className="text-gray-400 text-sm">Les emails et notifications seront envoyés automatiquement</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-4">
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal d'aperçu */}
      <AnimatePresence>
        {isPreviewModalOpen && selectedTemplate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gray-800 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Aperçu du Template</h2>
                    <p className="text-gray-400 text-sm">{getTemplateName(selectedTemplate.type)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-88px)] bg-gray-50 p-6">
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html_body }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
