'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Plus, Edit, Trash2, Eye, Send, Save, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  html_body: string;
  text_body: string | null;
  variables: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { token, admin, logoutAdmin } = useAuthStore();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    html_body: '',
    text_body: '',
    variables: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-templates`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des templates:', error);
      toast.error('Erreur lors de la récupération des templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        // Update
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-templates/${editingTemplate.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        toast.success('Template mis à jour avec succès');
      } else {
        // Create
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-templates`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        toast.success('Template créé avec succès');
      }

      fetchTemplates();
      closeModal();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-templates/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Template supprimé');
      fetchTemplates();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleSendTest = async (template: EmailTemplate) => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Email invalide');
      return;
    }

    setSendingTest(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-templates/${template.id}/test`,
        { email: testEmail },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success(`Email de test envoyé à ${testEmail}`);
      setIsTestOpen(false);
      setTestEmail('');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du test:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSendingTest(false);
    }
  };

  const openEditModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body || '',
      variables: template.variables || '',
      description: template.description || '',
      is_active: template.is_active
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      type: '',
      subject: '',
      html_body: '',
      text_body: '',
      variables: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const openPreview = (template: EmailTemplate) => {
    setPreviewHtml(template.html_body);
    setIsPreviewOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'transaction_validated': 'Transaction Validée',
      'transaction_rejected': 'Transaction Rejetée',
      'kyc_validated': 'KYC Validé',
      'kyc_rejected': 'KYC Rejeté'
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'transaction_validated': 'bg-green-500/20 text-green-400 border-green-500/30',
      'transaction_rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
      'kyc_validated': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'kyc_rejected': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="EMILE TRANSFER"
        subtitle="Gestion des templates d'emails"
        userName={admin?.username}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                Templates d'Emails
              </h1>
              <p className="text-gray-400">Gérez les templates d'emails envoyés aux utilisateurs</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              Nouveau Template
            </motion.button>
          </div>
        </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getTypeBadgeColor(template.type)}`}>
                    {getTypeLabel(template.type)}
                  </span>
                  {template.is_active ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">Actif</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-md">Inactif</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white">{template.subject}</h3>
                {template.description && (
                  <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                )}
              </div>
            </div>

            {template.variables && (
              <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Variables disponibles :</p>
                <p className="text-xs text-cyan-400 font-mono">{template.variables}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openPreview(template)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all border border-blue-500/30"
              >
                <Eye className="w-4 h-4" />
                Aperçu
              </button>
              <button
                onClick={() => {
                  setEditingTemplate(template);
                  setIsTestOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-all border border-green-500/30"
              >
                <Send className="w-4 h-4" />
                Test
              </button>
              <button
                onClick={() => openEditModal(template)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-all border border-orange-500/30"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all border border-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
              Mis à jour : {new Date(template.updated_at).toLocaleString('fr-FR')}
            </div>
          </motion.div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="max-w-7xl mx-auto text-center py-16">
          <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Aucun template d'email</p>
          <p className="text-gray-500 text-sm mt-2">Créez votre premier template pour commencer</p>
        </div>
      )}

      {/* Modal Create/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {editingTemplate ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  {editingTemplate ? 'Modifier le Template' : 'Nouveau Template'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      disabled={!!editingTemplate}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      placeholder="ex: transaction_validated"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Identifiant unique du template</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Statut
                    </label>
                    <select
                      value={formData.is_active.toString()}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sujet de l'email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="ex: ✅ Transaction validée - EMB Transfer+"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Description courte du template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Variables disponibles
                  </label>
                  <input
                    type="text"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                    placeholder="{{user_name}}, {{transaction_id}}, {{amount}}"
                  />
                  <p className="text-xs text-gray-500 mt-1">Variables séparées par des virgules</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contenu HTML <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.html_body}
                    onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                    rows={15}
                    placeholder="Contenu HTML de l'email..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contenu texte (fallback)
                  </label>
                  <textarea
                    value={formData.text_body}
                    onChange={(e) => setFormData({ ...formData, text_body: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    rows={8}
                    placeholder="Version texte brut de l'email..."
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-700">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-all"
                  >
                    <Save className="w-5 h-5" />
                    {editingTemplate ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Preview */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gray-800 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-6 h-6" />
                  Aperçu du Template
                </h2>
                <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-88px)] bg-gray-50 p-6">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Test */}
      <AnimatePresence>
        {isTestOpen && editingTemplate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full"
            >
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Envoyer un email de test
                </h2>
                <button onClick={() => setIsTestOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Un email de test avec des données fictives sera envoyé à l'adresse indiquée.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="exemple@email.com"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleSendTest(editingTemplate)}
                    disabled={sendingTest}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    {sendingTest ? 'Envoi...' : 'Envoyer'}
                  </button>
                  <button
                    onClick={() => setIsTestOpen(false)}
                    disabled={sendingTest}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
