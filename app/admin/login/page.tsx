'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Shield, User, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const setAdmin = useAuthStore((state) => state.setAdmin);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminAPI.login(formData);
      const { token, admin } = response.data;
      
      setAdmin(admin, token);
      toast.success('Connexion admin réussie !');
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 px-4">
      <div className="max-w-md w-full">
        <div className="card animate-slide-in">
          <div className="text-center mb-8">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600 mt-2">Espace réservé aux administrateurs</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">
                <User className="w-4 h-4 inline mr-2" />
                Nom d'utilisateur
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="admin"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
              ← Retour à l'espace client
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
