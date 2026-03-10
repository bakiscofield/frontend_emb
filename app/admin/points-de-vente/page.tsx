'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { pointsDeVenteAPI, adminAPI } from '@/lib/api';
import Header from '@/components/Header';
import NotificationBell from '@/components/NotificationBell';
import toast from 'react-hot-toast';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  UserPlus,
  UserMinus,
  X,
  Search
} from 'lucide-react';

interface PointDeVente {
  id: number;
  name: string;
  address: string;
  google_maps_url: string | null;
  is_active: boolean;
  created_at: string;
  agents: Array<{
    id: number;
    username: string;
    email: string | null;
    is_active: boolean;
  }>;
}

interface Admin {
  id: number;
  username: string;
  email: string | null;
  is_active: boolean;
}

export default function PointsDeVentePage() {
  const router = useRouter();
  const { admin, isAdmin, isAuthenticated, logoutAdmin, initAuth, hasPermission, hasAnyPermission } = useAuthStore();
  const [pointsDeVente, setPointsDeVente] = useState<PointDeVente[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedPdV, setSelectedPdV] = useState<PointDeVente | null>(null);
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [formData, setFormData] = useState({ name: '', address: '', google_maps_url: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initAuth();
    if (!isAuthenticated || !isAdmin) {
      router.push('/admin/login');
      return;
    }
    if (!hasAnyPermission('VIEW_POINTS_DE_VENTE', 'MANAGE_POINTS_DE_VENTE')) {
      toast.error('Permission insuffisante');
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, isAdmin, router, initAuth]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadData();
    }
  }, [isAuthenticated, isAdmin]);

  const loadData = async () => {
    try {
      const res = await pointsDeVenteAPI.getAll();
      setPointsDeVente(res.data.data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des points de vente');
    }
  };

  const loadAdmins = async () => {
    try {
      const res = await adminAPI.listAdmins();
      setAllAdmins(res.data.admins || res.data.data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des agents');
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Le nom et l\'adresse sont requis');
      return;
    }
    setLoading(true);
    try {
      await pointsDeVenteAPI.create(formData);
      toast.success('Point de vente créé');
      setShowCreateModal(false);
      setFormData({ name: '', address: '', google_maps_url: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPdV) return;
    setLoading(true);
    try {
      await pointsDeVenteAPI.update(selectedPdV.id.toString(), formData);
      toast.success('Point de vente modifié');
      setShowEditModal(false);
      setSelectedPdV(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce point de vente ?')) return;
    try {
      await pointsDeVenteAPI.delete(id.toString());
      toast.success('Point de vente supprimé');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (pdv: PointDeVente) => {
    try {
      await pointsDeVenteAPI.update(pdv.id.toString(), { is_active: !pdv.is_active });
      toast.success(pdv.is_active ? 'Point de vente désactivé' : 'Point de vente activé');
      loadData();
    } catch (error: any) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleAddAgent = async (adminId: number) => {
    if (!selectedPdV) return;
    try {
      await pointsDeVenteAPI.assignAgent(selectedPdV.id.toString(), adminId);
      toast.success('Agent ajouté');
      loadData();
      // Refresh selected PdV
      const res = await pointsDeVenteAPI.getAll();
      const updated = res.data.data.find((p: PointDeVente) => p.id === selectedPdV.id);
      if (updated) setSelectedPdV(updated);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleRemoveAgent = async (adminId: number) => {
    if (!selectedPdV) return;
    try {
      await pointsDeVenteAPI.removeAgent(selectedPdV.id.toString(), adminId.toString());
      toast.success('Agent retiré');
      loadData();
      const res = await pointsDeVenteAPI.getAll();
      const updated = res.data.data.find((p: PointDeVente) => p.id === selectedPdV.id);
      if (updated) setSelectedPdV(updated);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du retrait');
    }
  };

  const openEditModal = (pdv: PointDeVente) => {
    setSelectedPdV(pdv);
    setFormData({ name: pdv.name, address: pdv.address, google_maps_url: pdv.google_maps_url || '' });
    setShowEditModal(true);
  };

  const openAgentModal = (pdv: PointDeVente) => {
    setSelectedPdV(pdv);
    loadAdmins();
    setShowAgentModal(true);
  };

  if (!isAuthenticated || !isAdmin || !admin) return null;

  const canManage = hasPermission('MANAGE_POINTS_DE_VENTE');

  const filteredPdV = pointsDeVente.filter(pdv =>
    pdv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pdv.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header
        title="EMILE TRANSFER"
        subtitle="Panneau d'administration"
        userName={admin.username}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
        adminPermissions={admin.permissions || []}
      >
        <NotificationBell />
      </Header>

      <div className="min-h-screen relative">
        <div className="cyber-grid"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-6 h-6 text-teal-400" />
                Points de vente
              </h1>
              <p className="text-sm text-gray-400 mt-1">{pointsDeVente.length} point(s) de vente</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-emile pl-10 w-full"
                />
              </div>
              {canManage && (
                <button
                  onClick={() => {
                    setFormData({ name: '', address: '', google_maps_url: '' });
                    setShowCreateModal(true);
                  }}
                  className="btn-emile-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajouter</span>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          {filteredPdV.length === 0 ? (
            <div className="card-emile text-center py-12">
              <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchQuery ? 'Aucun résultat' : 'Aucun point de vente'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPdV.map((pdv) => (
                <div key={pdv.id} className={`card-emile transition-all ${!pdv.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white truncate">{pdv.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${pdv.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {pdv.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{pdv.address}</p>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => openEditModal(pdv)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pdv.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {pdv.google_maps_url && (
                    <a
                      href={pdv.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 mb-3"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Voir sur Google Maps
                    </a>
                  )}

                  {/* Agents */}
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400 font-medium">
                        Agents ({pdv.agents?.length || 0})
                      </p>
                      {canManage && (
                        <button
                          onClick={() => openAgentModal(pdv)}
                          className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          Gérer
                        </button>
                      )}
                    </div>
                    {pdv.agents?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {pdv.agents.map((agent) => (
                          <span key={agent.id} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded-lg text-xs text-gray-300">
                            <span className={`w-1.5 h-1.5 rounded-full ${agent.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                            {agent.username}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Aucun agent rattaché</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-emile w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Nouveau point de vente</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nom *</label>
                <input
                  type="text"
                  className="input-emile w-full"
                  placeholder="Nom du point de vente"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Adresse *</label>
                <input
                  type="text"
                  className="input-emile w-full"
                  placeholder="Adresse complète"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Lien Google Maps</label>
                <input
                  type="text"
                  className="input-emile w-full"
                  placeholder="https://maps.google.com/..."
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 btn-emile-primary py-2.5"
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPdV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-emile w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Modifier le point de vente</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nom *</label>
                <input
                  type="text"
                  className="input-emile w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Adresse *</label>
                <input
                  type="text"
                  className="input-emile w-full"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Lien Google Maps</label>
                <input
                  type="text"
                  className="input-emile w-full"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-300">Statut :</label>
                <button
                  onClick={() => handleToggleActive(selectedPdV)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${selectedPdV.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                >
                  {selectedPdV.is_active ? 'Actif' : 'Inactif'}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 btn-emile-primary py-2.5"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Management Modal */}
      {showAgentModal && selectedPdV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-emile w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Agents - {selectedPdV.name}</h2>
              <button onClick={() => setShowAgentModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Agents actuels */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Agents rattachés</h3>
              {selectedPdV.agents?.length > 0 ? (
                <div className="space-y-2">
                  {selectedPdV.agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-sm text-white">{agent.username}</span>
                        {agent.email && <span className="text-xs text-gray-500">({agent.email})</span>}
                      </div>
                      <button
                        onClick={() => handleRemoveAgent(agent.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Retirer"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Aucun agent</p>
              )}
            </div>

            {/* Ajouter un agent */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Ajouter un agent</h3>
              <div className="space-y-2">
                {allAdmins
                  .filter(a => !selectedPdV.agents?.some(ag => ag.id === a.id))
                  .map((adm) => (
                    <div key={adm.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${adm.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-sm text-gray-300">{adm.username}</span>
                      </div>
                      <button
                        onClick={() => handleAddAgent(adm.id)}
                        className="p-1.5 text-teal-400 hover:bg-teal-500/20 rounded-lg transition-colors"
                        title="Ajouter"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                {allAdmins.filter(a => !selectedPdV.agents?.some(ag => ag.id === a.id)).length === 0 && (
                  <p className="text-sm text-gray-500 italic">Tous les admins sont déjà rattachés</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAgentModal(false)}
              className="w-full mt-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
