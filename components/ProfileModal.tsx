'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Camera, Shield, CheckCircle, Clock, XCircle, Upload, Edit2, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usersAPI, kycAPI } from '@/lib/api';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import VerifiedBadge from './VerifiedBadge';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    email?: string;
    phone: string;
    kyc_verified: boolean;
    kyc_status: 'pending' | 'approved' | 'rejected';
  };
  onProfileUpdate: () => void;
}

export default function ProfileModal({ isOpen, onClose, user, onProfileUpdate }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'kyc' | 'notifications'>('profile');
  const [loading, setLoading] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);

  // Hook pour les notifications push
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    permission: pushPermission,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush
  } = usePushNotifications();

  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email || '',
    phone: user.phone
  });

  const [kycData, setKycData] = useState<{
    document_type: string;
    document_front: File | null;
    document_back: File | null;
    frontPreview: string | null;
    backPreview: string | null;
  }>({
    document_type: 'passport',
    document_front: null,
    document_back: null,
    frontPreview: null,
    backPreview: null
  });

  const [existingKyc, setExistingKyc] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchKycStatus();
    }
  }, [isOpen]);

  const fetchKycStatus = async () => {
    try {
      const response = await kycAPI.getStatus();
      setExistingKyc(response.data.kyc);
    } catch (error) {
      console.error('Erreur lors de la recuperation du statut KYC:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await usersAPI.updateProfile({
        name: profileData.name,
        email: profileData.email
      });

      toast.success('Profil mis a jour avec succes');
      onProfileUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise a jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas depasser 5 MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit etre une image');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setKycData(prev => ({
        ...prev,
        [side === 'front' ? 'document_front' : 'document_back']: file,
        [side === 'front' ? 'frontPreview' : 'backPreview']: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kycData.document_front) {
      toast.error('Veuillez fournir au moins le recto du document');
      return;
    }

    setKycLoading(true);

    try {
      const formData = new FormData();
      formData.append('document_type', kycData.document_type);
      formData.append('document_front', kycData.document_front);
      if (kycData.document_back) {
        formData.append('document_back', kycData.document_back);
      }

      await kycAPI.submit(formData);

      toast.success('Documents KYC soumis avec succes. Ils seront verifies sous peu.');

      setKycData({
        document_type: 'passport',
        document_front: null,
        document_back: null,
        frontPreview: null,
        backPreview: null
      });

      fetchKycStatus();
      onProfileUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission des documents');
    } finally {
      setKycLoading(false);
    }
  };

  const getKycStatusBadge = () => {
    if (!existingKyc) return null;

    const statusConfig: Record<string, { icon: any; color: string; text: string }> = {
      pending: { icon: Clock, color: 'text-yellow-500', text: 'En attente de verification' },
      approved: { icon: CheckCircle, color: 'text-green-500', text: 'Verifie' },
      rejected: { icon: XCircle, color: 'text-red-500', text: 'Rejete' }
    };

    const config = statusConfig[existingKyc.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium">{config.text}</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-2 border-red-500/30 shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Mon Profil
                  {user.kyc_verified && <VerifiedBadge size="md" />}
                </h2>
                <p className="text-sm text-gray-400">{user.phone}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-red-500 border-b-2 border-red-500 bg-red-500/5'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Edit2 className="w-4 h-4 inline mr-2" />
              Profil
            </button>
            <button
              onClick={() => setActiveTab('kyc')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'kyc'
                  ? 'text-red-500 border-b-2 border-red-500 bg-red-500/5'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              KYC
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'notifications'
                  ? 'text-red-500 border-b-2 border-red-500 bg-red-500/5'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Notifications
              {!pushSubscribed && pushSupported && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telephone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    disabled
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Le numero de telephone ne peut pas etre modifie</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Mise a jour...' : 'Mettre a jour le profil'}
                </button>
              </form>
            )}

            {activeTab === 'kyc' && (
              <div className="space-y-6">
                {existingKyc && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Statut de votre verification
                    </h3>

                    {getKycStatusBadge()}

                    {existingKyc.status === 'rejected' && existingKyc.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400">
                          <strong>Raison du rejet:</strong> {existingKyc.rejection_reason}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Vous pouvez soumettre de nouveaux documents ci-dessous.
                        </p>
                      </div>
                    )}

                    {existingKyc.status === 'pending' && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm text-yellow-400">
                          Vos documents sont en cours de verification. Vous serez notifie des que la verification sera terminee.
                        </p>
                      </div>
                    )}

                    {existingKyc.status === 'approved' && (
                      <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Votre compte est verifie! Vous pouvez profiter de tous les avantages.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(!existingKyc || existingKyc.status === 'rejected') && (
                  <form onSubmit={handleKycSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Type de document
                      </label>
                      <select
                        value={kycData.document_type}
                        onChange={(e) => setKycData({ ...kycData, document_type: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="passport">Passeport</option>
                        <option value="national_id">Carte d'identite nationale</option>
                        <option value="driver_license">Permis de conduire</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Camera className="w-4 h-4 inline mr-2" />
                        Recto du document *
                      </label>
                      <div className="relative">
                        {kycData.frontPreview ? (
                          <div className="relative">
                            <img
                              src={kycData.frontPreview}
                              alt="Recto"
                              className="w-full h-48 object-cover rounded-lg border-2 border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={() => setKycData({ ...kycData, document_front: null, frontPreview: null })}
                              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                            <Upload className="w-12 h-12 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-400">Cliquez pour telecharger</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'a 5MB</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'front')}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {kycData.document_type !== 'passport' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Camera className="w-4 h-4 inline mr-2" />
                          Verso du document
                        </label>
                        <div className="relative">
                          {kycData.backPreview ? (
                            <div className="relative">
                              <img
                                src={kycData.backPreview}
                                alt="Verso"
                                className="w-full h-48 object-cover rounded-lg border-2 border-gray-600"
                              />
                              <button
                                type="button"
                                onClick={() => setKycData({ ...kycData, document_back: null, backPreview: null })}
                                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                              <Upload className="w-12 h-12 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-400">Cliquez pour telecharger</p>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'a 5MB</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'back')}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={kycLoading || !kycData.document_front}
                      className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                    >
                      {kycLoading ? 'Envoi en cours...' : 'Soumettre les documents'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications Push
                  </h3>

                  {!pushSupported && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">
                        Les notifications push ne sont pas supportées par votre navigateur.
                      </p>
                    </div>
                  )}

                  {pushSupported && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-gray-900/50 rounded-lg">
                        <Bell className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-300 leading-relaxed">
                            Recevez des notifications en temps réel sur vos transactions : validations, rejets, et mises à jour importantes.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">Statut</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {pushSubscribed ? 'Activées' : 'Désactivées'}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            pushSubscribed
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-700 text-gray-400 border border-gray-600'
                          }`}>
                            {pushSubscribed ? '✓ Actif' : '○ Inactif'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">Permission</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {pushPermission === 'granted' ? 'Accordée' :
                               pushPermission === 'denied' ? 'Refusée' :
                               'Non demandée'}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            pushPermission === 'granted'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : pushPermission === 'denied'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {pushPermission === 'granted' ? '✓' :
                             pushPermission === 'denied' ? '✗' :
                             '?'}
                          </div>
                        </div>
                      </div>

                      {pushPermission === 'denied' && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-sm text-yellow-400">
                            <strong>Permission refusée</strong><br />
                            Pour activer les notifications, vous devez autoriser les notifications dans les paramètres de votre navigateur.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {!pushSubscribed ? (
                          <button
                            onClick={async () => {
                              try {
                                await subscribePush();
                                toast.success('Notifications push activées avec succès !');
                              } catch (error: any) {
                                toast.error(error.message || 'Erreur lors de l\'activation des notifications');
                              }
                            }}
                            disabled={pushLoading || pushPermission === 'denied'}
                            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {pushLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Activation...
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4" />
                                Activer les notifications
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await unsubscribePush();
                                toast.success('Notifications push désactivées');
                              } catch (error: any) {
                                toast.error(error.message || 'Erreur lors de la désactivation');
                              }
                            }}
                            disabled={pushLoading}
                            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {pushLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Désactivation...
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4" />
                                Désactiver les notifications
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-400">
                          <strong>💡 Astuce :</strong> Les notifications push vous permettent de rester informé même quand vous n'êtes pas sur l'application. Vous recevrez une notification sur votre appareil dès qu'une action est effectuée sur votre compte.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
