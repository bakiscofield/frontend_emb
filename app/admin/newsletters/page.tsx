'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { newslettersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

interface Newsletter {
  id: number;
  title: string;
  subject: string;
  content: string;
  content_html?: string;
  status: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  sent_at?: string;
  recipient_count?: number;
}

interface SubscriberStats {
  total_users: number;
  subscribed_users: number;
  unsubscribed_users: number;
  active_users: number;
}

export default function NewsletterManagement() {
  const router = useRouter();
  const { admin, isAdmin, logoutAdmin } = useAuthStore();

  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [recipientType, setRecipientType] = useState('subscribers');

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    content: '',
    content_html: ''
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchNewsletters();
    fetchStats();
  }, [isAdmin, router]);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const response = await newslettersAPI.getAll();
      setNewsletters(response.data.newsletters);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await newslettersAPI.getSubscriberStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const handleCreateNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.subject || !formData.content) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await newslettersAPI.create(formData);
      toast.success('Newsletter créée en tant que brouillon');
      setShowCreateModal(false);
      setFormData({ title: '', subject: '', content: '', content_html: '' });
      fetchNewsletters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleSendNewsletter = async () => {
    if (!selectedNewsletter) return;

    try {
      const response = await newslettersAPI.send(
        selectedNewsletter.id.toString(),
        recipientType
      );
      toast.success(response.data.message);
      setShowSendModal(false);
      setSelectedNewsletter(null);
      fetchNewsletters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const handleDeleteNewsletter = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette newsletter ?')) return;

    try {
      await newslettersAPI.delete(id.toString());
      toast.success('Newsletter supprimée');
      fetchNewsletters();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const openSendModal = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setShowSendModal(true);
  };

  const getRecipientCount = () => {
    if (!stats) return 0;
    switch (recipientType) {
      case 'all':
        return stats.total_users;
      case 'subscribers':
        return stats.subscribed_users;
      case 'active':
        return stats.active_users;
      default:
        return 0;
    }
  };

  if (loading) {
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
        subtitle="Gestion des Newsletters"
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Gestion des Newsletters</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all text-sm sm:text-base"
            >
              + Nouvelle Newsletter
            </button>
          </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 sm:p-4 md:p-6">
              <div className="text-gray-400 text-xs sm:text-sm mb-1">Total Utilisateurs</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stats.total_users}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-3 sm:p-4 md:p-6">
              <div className="text-gray-400 text-xs sm:text-sm mb-1">Abonnés</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400">{stats.subscribed_users}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-red-500/30 rounded-xl p-3 sm:p-4 md:p-6">
              <div className="text-gray-400 text-xs sm:text-sm mb-1">Non-abonnés</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-400">{stats.unsubscribed_users}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-3 sm:p-4 md:p-6">
              <div className="text-gray-400 text-xs sm:text-sm mb-1">Utilisateurs Actifs</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400">{stats.active_users}</div>
            </div>
          </div>
        )}

        {/* Liste des newsletters */}
        <div className="grid gap-3 sm:gap-4">
          {newsletters.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 sm:p-12 text-center">
              <p className="text-gray-400 text-base sm:text-lg">Aucune newsletter créée</p>
            </div>
          ) : (
            newsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6 hover:border-red-500/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-white">{newsletter.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
                        newsletter.status === 'draft'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {newsletter.status === 'draft' ? 'Brouillon' : 'Envoyée'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-2">
                      <span className="font-medium">Sujet:</span> {newsletter.subject}
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      Par {newsletter.created_by_name} • {new Date(newsletter.created_at).toLocaleString('fr-FR')}
                      {newsletter.sent_at && (
                        <span className="block xs:inline xs:ml-2 mt-1 xs:mt-0">
                          • Envoyée le {new Date(newsletter.sent_at).toLocaleString('fr-FR')}
                          {newsletter.recipient_count && ` à ${newsletter.recipient_count} destinataires`}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newsletter.status === 'draft' && (
                      <button
                        onClick={() => openSendModal(newsletter)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                      >
                        Envoyer
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNewsletter(newsletter.id)}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                  <p className="text-gray-300 text-xs sm:text-sm line-clamp-3">{newsletter.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Création */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 max-w-2xl w-full my-8 border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Créer une Newsletter</h2>

              <form onSubmit={handleCreateNewsletter} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-xs sm:text-sm">Titre</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none text-sm sm:text-base"
                    placeholder="Titre interne de la newsletter"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-xs sm:text-sm">Sujet (Email)</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none text-sm sm:text-base"
                    placeholder="Sujet de l'email"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-xs sm:text-sm">Contenu (Texte)</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none text-sm sm:text-base"
                    placeholder="Contenu de la newsletter en texte brut"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium text-xs sm:text-sm">Contenu HTML (optionnel)</label>
                  <textarea
                    rows={4}
                    value={formData.content_html}
                    onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none font-mono text-xs sm:text-sm resize-none"
                    placeholder="<h1>Votre contenu HTML...</h1>"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all font-semibold text-sm sm:text-base"
                  >
                    Créer en Brouillon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ title: '', subject: '', content: '', content_html: '' });
                    }}
                    className="flex-1 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-sm sm:text-base"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Envoi */}
        {showSendModal && selectedNewsletter && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 max-w-md w-full border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Envoyer la Newsletter</h2>

              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                <span className="font-semibold">{selectedNewsletter.title}</span>
              </p>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition-colors border border-gray-600">
                  <input
                    type="radio"
                    name="recipientType"
                    value="subscribers"
                    checked={recipientType === 'subscribers'}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-4 h-4 text-red-500 focus:ring-red-500 focus:ring-offset-gray-800 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm sm:text-base">Abonnés uniquement</div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      {stats?.subscribed_users || 0} destinataires
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition-colors border border-gray-600">
                  <input
                    type="radio"
                    name="recipientType"
                    value="active"
                    checked={recipientType === 'active'}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-4 h-4 text-red-500 focus:ring-red-500 focus:ring-offset-gray-800 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm sm:text-base">Utilisateurs actifs</div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      {stats?.active_users || 0} destinataires (ayant au moins 1 transaction)
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition-colors border border-gray-600">
                  <input
                    type="radio"
                    name="recipientType"
                    value="all"
                    checked={recipientType === 'all'}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-4 h-4 text-red-500 focus:ring-red-500 focus:ring-offset-gray-800 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm sm:text-base">Tous les utilisateurs</div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      {stats?.total_users || 0} destinataires
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-yellow-400 text-xs sm:text-sm">
                  Cette newsletter sera envoyée à {getRecipientCount()} destinataires.
                  Cette action est irréversible.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSendNewsletter}
                  className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all font-semibold text-sm sm:text-base"
                >
                  Envoyer Maintenant
                </button>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSelectedNewsletter(null);
                  }}
                  className="flex-1 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-sm sm:text-base"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
