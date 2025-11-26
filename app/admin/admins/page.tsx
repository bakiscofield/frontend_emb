'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, permissionsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Header from '@/components/Header';
import NotificationBell from '@/components/NotificationBell';
import toast from 'react-hot-toast';

interface Permission {
  id: number;
  code: string;
  name: string;
  category: string;
  description?: string;
}

interface Admin {
  id: number;
  username: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  permissions: Permission[];
  permission_count: number;
}

export default function AdminManagement() {
  const router = useRouter();
  const { admin, isAdmin, logoutAdmin } = useAuthStore();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [allPermissions, setAllPermissions] = useState<{ [key: string]: Permission[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', email: '' });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchAdmins();
    fetchPermissions();
  }, [isAdmin, router]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listAdmins();
      setAdmins(response.data.admins);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await permissionsAPI.getAll();
      setAllPermissions(response.data.grouped);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des permissions');
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    try {
      await adminAPI.toggleAdminStatus(admin.id.toString());
      toast.success(`Admin ${admin.is_active ? 'désactivé' : 'activé'}`);
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };


  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;

    try {
      await permissionsAPI.updateAdminPermissions(
        selectedAdmin.id.toString(),
        selectedPermissions
      );
      toast.success('Permissions mises à jour');
      setShowPermissionsModal(false);
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newAdmin.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      await adminAPI.createAdmin(newAdmin);
      toast.success('Administrateur créé');
      setShowCreateModal(false);
      setNewAdmin({ username: '', password: '', email: '' });
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleOpenPermissions = (admin: Admin) => {
    setSelectedAdmin(admin);
    setSelectedPermissions(admin.permissions.map(p => p.id));
    setExpandedCategories(new Set()); // Reset expanded categories
    setShowPermissionsModal(true);
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
        subtitle="Gestion des Administrateurs"
        userName={admin?.username || 'Admin'}
        onLogout={() => {
          logoutAdmin();
          router.push('/admin/login');
        }}
        showAdminNav={true}
      >
        <NotificationBell />
      </Header>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-4 sm:pt-6 p-3 sm:p-6">
        <div className="cyber-grid"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gestion des Administrateurs</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2 text-sm sm:text-base bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all"
            >
              + Nouvel Admin
            </button>
          </div>

        <div className="grid gap-3 sm:gap-4">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-6 hover:border-red-500/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">{admin.username}</h3>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                      admin.is_active
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {admin.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </div>
                  {admin.email && (
                    <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2 truncate">{admin.email}</p>
                  )}
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {admin.permission_count} permission(s) • Créé le{' '}
                    {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenPermissions(admin)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                  >
                    Permissions
                  </button>
                  <button
                    onClick={() => handleToggleStatus(admin)}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${
                      admin.is_active
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {admin.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Permissions */}
        {showPermissionsModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto" onClick={() => setShowPermissionsModal(false)}>
            <div className="bg-gray-800 rounded-xl sm:rounded-2xl max-w-2xl w-full my-auto max-h-[90vh] sm:max-h-[85vh] border border-gray-700 flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header fixe */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white truncate pr-2">
                  Permissions de {selectedAdmin.username}
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPermissionsModal(false);
                  }}
                  className="flex-shrink-0 p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Fermer"
                  type="button"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenu scrollable */}
              <div className="overflow-y-auto overflow-x-hidden p-3 sm:p-4 flex-1 overscroll-contain">
                {Object.entries(allPermissions).map(([category, perms]) => {
                  const isExpanded = expandedCategories.has(category);
                  const categoryPermCount = perms.filter(p => selectedPermissions.includes(p.id)).length;

                  return (
                    <div key={category} className="mb-2 last:mb-0">
                      {/* Category Header - Clickable */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-2 sm:p-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg transition-colors mb-1"
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <h3 className="text-sm sm:text-base font-semibold text-white text-left">{category}</h3>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                          {categoryPermCount}/{perms.length}
                        </span>
                      </button>

                      {/* Category Content - Collapsible */}
                      {isExpanded && (
                        <div className="space-y-1.5 sm:space-y-2 pl-2 sm:pl-3">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="mt-0.5 sm:mt-1 w-4 h-4 flex-shrink-0 rounded border-gray-600 text-red-500 focus:ring-red-500 focus:ring-offset-gray-800"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium text-xs sm:text-sm">{perm.name}</div>
                                {perm.description && (
                                  <div className="text-gray-400 text-[10px] sm:text-xs mt-0.5">{perm.description}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer fixe avec boutons */}
              <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-700 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSavePermissions();
                  }}
                  type="button"
                  className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all font-semibold"
                >
                  Enregistrer
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPermissionsModal(false);
                  }}
                  type="button"
                  className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Création Admin */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Créer un Administrateur</h2>

              <form onSubmit={handleCreateAdmin} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-300 mb-1.5 sm:mb-2 font-medium text-sm sm:text-base">Nom d'utilisateur</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1.5 sm:mb-2 font-medium text-sm sm:text-base">Email (optionnel)</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1.5 sm:mb-2 font-medium text-sm sm:text-base">Mot de passe</label>
                  <input
                    type="password"
                    required
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">Minimum 8 caractères</p>
                </div>

                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all font-semibold"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewAdmin({ username: '', password: '', email: '' });
                    }}
                    className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
