'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Phone, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { token, user } = response.data;

      setUser(user, token);
      toast.success('Connexion réussie !');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #FFF8F8 50%, #F5F5F5 100%)' }}>
      {/* Motif de fond subtil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #FF3B38 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo EMILE TRANSFER+ */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="EMILE TRANSFER+"
              width={300}
              height={100}
              className="h-20 w-auto drop-shadow-lg cursor-pointer hover:scale-105 transition-transform"
              priority
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
          <p className="text-gray-600">Accédez à votre espace client sécurisé</p>
        </div>

        {/* Formulaire avec style sombre */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl border-2 border-emile-red/30 p-8 animate-slide-in backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-emile-red" />
                Numéro de téléphone
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emile-red/50 focus:border-emile-red transition-all text-white placeholder-gray-400"
                placeholder="+228 XX XX XX XX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-emile-red" />
                Mot de passe
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emile-red/50 focus:border-emile-red transition-all text-white placeholder-gray-400"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-400 hover:text-emile-red transition-colors font-medium"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-emile-red to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emile-red/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-400">ou</span>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-gray-300 text-sm">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-emile-red hover:text-emile-red-glow font-semibold transition-colors">
                S'inscrire
              </Link>
            </p>
            <p className="text-gray-400 text-xs">
              Vous êtes administrateur ?{' '}
              <Link href="/admin/login" className="text-emile-green hover:text-emile-green-glow font-semibold transition-colors">
                Connexion admin
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          © 2025 EMILE TRANSFER+ - Tous droits réservés
        </p>
      </div>
    </div>
  );
}
