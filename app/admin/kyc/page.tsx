'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import Header from '@/components/Header';
import NotificationBell from '@/components/NotificationBell';
import GlassCard from '@/components/GlassCard';
import NeonButton from '@/components/NeonButton';
import { kycAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface KYCDocument {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  document_type: string;
  document_front: string;
  document_back: string | null;
  status: string;
  rejection_reason: string | null;
  verified_by: number | null;
  verified_by_name: string | null;
  verified_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminKYCPage() {
  const router = useRouter();
  const { admin, isAuthenticated, isAdmin, logoutAdmin, initAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<KYCDocument[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [documentFrontUrl, setDocumentFrontUrl] = useState<string | null>(null);
  const [documentBackUrl, setDocumentBackUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    initAuth();
    if (!isAuthenticated || !isAdmin || !admin) {
      router.push('/admin/login');
      return;
    }
    fetchDocuments();
  }, [isAuthenticated, isAdmin, admin, router, initAuth]);

  useEffect(() => {
    filterDocuments();
  }, [activeFilter, documents]);

  // Nettoyer les blob URLs quand le modal se ferme ou que le composant se démonte
  useEffect(() => {
    return () => {
      if (documentFrontUrl) {
        URL.revokeObjectURL(documentFrontUrl);
      }
      if (documentBackUrl) {
        URL.revokeObjectURL(documentBackUrl);
      }
    };
  }, [documentFrontUrl, documentBackUrl]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await kycAPI.getAll();
      const docs = response.data.data.documents;
      setDocuments(docs);

      // Calculate stats
      const newStats = {
        total: docs.length,
        pending: docs.filter((d: KYCDocument) => d.status === 'pending').length,
        approved: docs.filter((d: KYCDocument) => d.status === 'approved').length,
        rejected: docs.filter((d: KYCDocument) => d.status === 'rejected').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    if (activeFilter === 'all') {
      setFilteredDocuments(documents);
    } else {
      setFilteredDocuments(documents.filter(doc => doc.status === activeFilter));
    }
  };

  const handleViewDocument = async (doc: KYCDocument) => {
    setSelectedDocument(doc);
    setRejectionReason('');
    setShowModal(true);
    setLoadingImages(true);
    setDocumentFrontUrl(null);
    setDocumentBackUrl(null);

    try {
      // Charger l'image recto
      const frontUrl = await kycAPI.fetchDocumentBlob(doc.document_front);
      setDocumentFrontUrl(frontUrl);

      // Charger l'image verso si elle existe
      if (doc.document_back) {
        const backUrl = await kycAPI.fetchDocumentBlob(doc.document_back);
        setDocumentBackUrl(backUrl);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des images');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDocument) return;

    try {
      setActionLoading(true);
      await kycAPI.verify(selectedDocument.id.toString());
      toast.success('Document approuvé avec succès');
      setShowModal(false);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDocument || !rejectionReason.trim()) {
      toast.error('Veuillez saisir une raison du rejet');
      return;
    }

    try {
      setActionLoading(true);
      await kycAPI.reject(selectedDocument.id.toString(), rejectionReason.trim());
      toast.success('Document rejeté');
      setShowModal(false);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs sm:text-sm font-medium">En attente</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            <span className="text-green-400 text-xs sm:text-sm font-medium">Approuvé</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
            <span className="text-red-400 text-xs sm:text-sm font-medium">Rejeté</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated || !isAdmin || !admin) {
    return null;
  }

  return (
    <>
      <Header
        title="EMILE TRANSFER"
        subtitle="Vérification KYC"
        userName={admin.username}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
      >
        <NotificationBell />
      </Header>

      <div className="min-h-screen pt-4 sm:pt-6 p-3 sm:p-6 relative">
        <div className="cyber-grid" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Vérification KYC
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Gérer les demandes de vérification d'identité
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            <GlassCard className="p-3 sm:p-4 md:p-6" glow glowColor="blue">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-400">Total</p>
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{stats.total}</p>
            </GlassCard>

            <GlassCard className="p-3 sm:p-4 md:p-6" glow glowColor="yellow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-400">En attente</p>
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{stats.pending}</p>
            </GlassCard>

            <GlassCard className="p-3 sm:p-4 md:p-6" glow glowColor="green">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-400">Approuvés</p>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{stats.approved}</p>
            </GlassCard>

            <GlassCard className="p-3 sm:p-4 md:p-6" glow glowColor="red">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-400">Rejetés</p>
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{stats.rejected}</p>
            </GlassCard>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { value: 'all', label: 'Tous' },
                { value: 'pending', label: 'En attente' },
                { value: 'approved', label: 'Approuvés' },
                { value: 'rejected', label: 'Rejetés' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    activeFilter === filter.value
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Documents List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <GlassCard className="p-8 sm:p-12 text-center">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm sm:text-base">Aucun document trouvé</p>
            </GlassCard>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="p-4 sm:p-6" glow glowColor="blue">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* User Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                              {doc.user_name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="break-all">{doc.user_email}</span>
                              </div>
                              {doc.user_phone && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>{doc.user_phone}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(doc.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">Type de document:</span>
                            <span className="text-white ml-2 font-medium">
                              {doc.document_type === 'carte_identite' ? 'Carte d\'identité' : 'Passeport'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Soumis le:</span>
                            <span className="text-white ml-2 font-medium">
                              {new Date(doc.created_at).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          {doc.verified_at && (
                            <div>
                              <span className="text-gray-500">Vérifié le:</span>
                              <span className="text-white ml-2 font-medium">
                                {new Date(doc.verified_at).toLocaleString('fr-FR')}
                              </span>
                            </div>
                          )}
                          {doc.verified_by_name && (
                            <div>
                              <span className="text-gray-500">Vérifié par:</span>
                              <span className="text-white ml-2 font-medium">{doc.verified_by_name}</span>
                            </div>
                          )}
                        </div>

                        {doc.rejection_reason && (
                          <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-xs sm:text-sm text-red-400">
                              <span className="font-semibold">Raison du rejet:</span> {doc.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <NeonButton
                          variant="primary"
                          onClick={() => handleViewDocument(doc)}
                          className="w-full lg:w-auto"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          <span className="text-sm sm:text-base">Voir les documents</span>
                        </NeonButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document View Modal */}
      <AnimatePresence>
        {showModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !actionLoading && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Vérification du document
                  </h2>
                  <p className="text-sm sm:text-base text-gray-400">{selectedDocument.user_name}</p>
                </div>
                <button
                  onClick={() => !actionLoading && setShowModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  disabled={actionLoading}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                </button>
              </div>

              {/* User Info */}
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Nom:</span>
                  <span className="text-white font-medium">{selectedDocument.user_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-medium break-all">{selectedDocument.user_email}</span>
                </div>
                {selectedDocument.user_phone && (
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Téléphone:</span>
                    <span className="text-white font-medium">{selectedDocument.user_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white font-medium">
                    {selectedDocument.document_type === 'carte_identite' ? 'Carte d\'identité' : 'Passeport'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Soumis le:</span>
                  <span className="text-white font-medium">
                    {new Date(selectedDocument.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4 mb-6">
                {loadingImages ? (
                  <div className="flex items-center justify-center py-12 bg-gray-800/30 rounded-lg">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Chargement des documents...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Recto du document</h3>
                      <div className="bg-gray-800/30 rounded-lg p-2 sm:p-4">
                        {documentFrontUrl ? (
                          <img
                            src={documentFrontUrl}
                            alt="Recto"
                            className="w-full h-auto rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <p className="text-gray-400 text-sm">Image non disponible</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedDocument.document_back && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Verso du document</h3>
                        <div className="bg-gray-800/30 rounded-lg p-2 sm:p-4">
                          {documentBackUrl ? (
                            <img
                              src={documentBackUrl}
                              alt="Verso"
                              className="w-full h-auto rounded-lg"
                            />
                          ) : (
                            <div className="flex items-center justify-center py-8">
                              <p className="text-gray-400 text-sm">Image non disponible</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Rejection Reason Input (if pending) */}
              {selectedDocument.status === 'pending' && (
                <div className="mb-6">
                  <label className="block text-sm sm:text-base font-medium text-gray-200 mb-3">
                    Raison du rejet (optionnel pour rejet)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Saisir la raison si vous rejetez le document..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                    rows={3}
                    disabled={actionLoading}
                  />
                </div>
              )}

              {/* Warning if already processed */}
              {selectedDocument.status !== 'pending' && (
                <div className="mb-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-400 text-xs sm:text-sm">
                    Ce document a déjà été traité. Le statut actuel est: <span className="font-semibold">{selectedDocument.status === 'approved' ? 'Approuvé' : 'Rejeté'}</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedDocument.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <NeonButton
                    variant="secondary"
                    fullWidth
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="text-sm sm:text-base">
                      {actionLoading ? 'Traitement...' : 'Rejeter'}
                    </span>
                  </NeonButton>
                  <NeonButton
                    variant="primary"
                    fullWidth
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="text-sm sm:text-base">
                      {actionLoading ? 'Traitement...' : 'Approuver'}
                    </span>
                  </NeonButton>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
