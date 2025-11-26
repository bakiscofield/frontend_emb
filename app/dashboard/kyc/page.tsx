'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { kycAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Header from '@/components/Header';
import GlassCard from '@/components/GlassCard';
import NeonButton from '@/components/NeonButton';
import toast from 'react-hot-toast';

interface KYCStatus {
  kyc_verified: boolean;
  kyc_status: string;
  document: {
    id: number;
    type: string;
    status: string;
    rejection_reason: string | null;
    verified_at: string | null;
    submitted_at: string;
  } | null;
}

export default function KYCPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [documentType, setDocumentType] = useState('carte_identite');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchKYCStatus();
  }, [isAuthenticated, router]);

  const fetchKYCStatus = async () => {
    try {
      const response = await kycAPI.getStatus();
      setKycStatus(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut KYC:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Seuls les fichiers JPG, PNG et PDF sont acceptés');
      return;
    }

    if (type === 'front') {
      setFrontFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFrontPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    } else {
      setBackFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setBackPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontFile) {
      toast.error('Veuillez uploader le recto du document');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('document_front', frontFile);
      if (backFile) {
        formData.append('document_back', backFile);
      }

      await kycAPI.submit(formData);
      toast.success('Documents soumis avec succès ! Votre demande sera examinée sous peu.');

      // Réinitialiser le formulaire
      setFrontFile(null);
      setBackFile(null);
      setFrontPreview(null);
      setBackPreview(null);

      // Recharger le statut
      fetchKYCStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!kycStatus) return null;

    if (kycStatus.kyc_verified) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-semibold">Compte Vérifié ✓</span>
        </div>
      );
    }

    if (kycStatus.kyc_status === 'pending') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <Clock className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-semibold">Vérification en cours...</span>
        </div>
      );
    }

    if (kycStatus.kyc_status === 'rejected') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-semibold">Document Rejeté</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg">
        <AlertCircle className="w-5 h-5 text-gray-400" />
        <span className="text-gray-400 font-semibold">Non vérifié</span>
      </div>
    );
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Header
        title="EMILE TRANSFER"
        subtitle="Vérification d'identité (KYC)"
        userName={user.name}
        isVerified={user.kyc_verified}
        onLogout={() => {
          logout();
          router.push('/login');
        }}
      />

      <div className="min-h-screen p-3 sm:p-6 relative">
        <div className="cyber-grid" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  Vérification KYC
                </h1>
                <p className="text-sm sm:text-base text-gray-400">
                  Vérifiez votre identité pour sécuriser votre compte
                </p>
              </div>
              {getStatusBadge()}
            </div>
          </motion.div>

          {/* Statut actuel */}
          {kycStatus && kycStatus.document && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <GlassCard className="p-4 sm:p-6" glow glowColor="blue">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                  Statut de votre demande
                </h2>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-gray-400 text-sm sm:text-base">Type de document:</span>
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {kycStatus.document.type === 'carte_identite' ? 'Carte d\'identité' : 'Passeport'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-gray-400 text-sm sm:text-base">Date de soumission:</span>
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {new Date(kycStatus.document.submitted_at).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  {kycStatus.document.status === 'rejected' && kycStatus.document.rejection_reason && (
                    <div className="mt-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm sm:text-base">
                        <span className="font-semibold">Raison du rejet:</span> {kycStatus.document.rejection_reason}
                      </p>
                    </div>
                  )}

                  {kycStatus.document.status === 'approved' && kycStatus.document.verified_at && (
                    <div className="mt-4 p-3 sm:p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm sm:text-base">
                        ✓ Vérifié le {new Date(kycStatus.document.verified_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Formulaire de soumission */}
          {(!kycStatus || kycStatus.kyc_status === 'rejected' || kycStatus.kyc_status === 'not_submitted') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-4 sm:p-6 md:p-8" glow glowColor="red">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  Soumettre vos documents
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Type de document */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-200 mb-3">
                      Type de document
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <label className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        documentType === 'carte_identite'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}>
                        <input
                          type="radio"
                          name="documentType"
                          value="carte_identite"
                          checked={documentType === 'carte_identite'}
                          onChange={(e) => setDocumentType(e.target.value)}
                          className="hidden"
                        />
                        <FileText className="w-5 h-5 text-red-400" />
                        <span className="text-white font-medium text-sm sm:text-base">Carte d'identité</span>
                      </label>

                      <label className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        documentType === 'passeport'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}>
                        <input
                          type="radio"
                          name="documentType"
                          value="passeport"
                          checked={documentType === 'passeport'}
                          onChange={(e) => setDocumentType(e.target.value)}
                          className="hidden"
                        />
                        <FileText className="w-5 h-5 text-red-400" />
                        <span className="text-white font-medium text-sm sm:text-base">Passeport</span>
                      </label>
                    </div>
                  </div>

                  {/* Upload Recto */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-200 mb-3">
                      Recto du document <span className="text-red-400">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 text-center hover:border-red-500/50 transition-colors">
                      <input
                        type="file"
                        id="front"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(e, 'front')}
                        className="hidden"
                      />
                      <label htmlFor="front" className="cursor-pointer">
                        {frontPreview ? (
                          <div className="relative">
                            <img src={frontPreview} alt="Recto" className="max-h-48 mx-auto rounded-lg" />
                            <p className="text-green-400 mt-2 text-sm sm:text-base">✓ {frontFile?.name}</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-300 text-sm sm:text-base">Cliquez pour uploader le recto</p>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1">JPG, PNG ou PDF (max 5MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Upload Verso */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-200 mb-3">
                      Verso du document {documentType === 'carte_identite' && <span className="text-red-400">*</span>}
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 text-center hover:border-red-500/50 transition-colors">
                      <input
                        type="file"
                        id="back"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(e, 'back')}
                        className="hidden"
                      />
                      <label htmlFor="back" className="cursor-pointer">
                        {backPreview ? (
                          <div className="relative">
                            <img src={backPreview} alt="Verso" className="max-h-48 mx-auto rounded-lg" />
                            <p className="text-green-400 mt-2 text-sm sm:text-base">✓ {backFile?.name}</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-300 text-sm sm:text-base">Cliquez pour uploader le verso</p>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1">JPG, PNG ou PDF (max 5MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                    <p className="text-blue-400 text-xs sm:text-sm">
                      ℹ️ Vos documents seront vérifiés par notre équipe dans les plus brefs délais.
                      Assurez-vous que les photos sont claires et lisibles.
                    </p>
                  </div>

                  {/* Boutons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <NeonButton
                      type="button"
                      variant="secondary"
                      fullWidth
                      onClick={() => router.push('/dashboard')}
                    >
                      <span className="text-sm sm:text-base">Retour</span>
                    </NeonButton>
                    <NeonButton
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={loading || !frontFile}
                    >
                      <span className="text-sm sm:text-base">{loading ? 'Envoi en cours...' : 'Soumettre'}</span>
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
